package com.booknest;

import com.booknest.servlets.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.servlet.ServletInputStream;
import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Embedded application server for BookNest.
 * Serves the Java HTTP Servlets on http://localhost:8080/booknest/api/*
 * (and http://localhost:8080/api/*).
 */
public class AppServer {

    private static int port = 8080;

    private static int determinePort() {
        String env = System.getenv("PORT");
        if (env != null && !env.trim().isEmpty()) {
            try {
                return Integer.parseInt(env.trim());
            } catch (NumberFormatException ignored) {}
        }
        return 8080;
    }

    public static void main(String[] args) throws Exception {
        port = determinePort();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        AuthServlet authServlet = new AuthServlet();
        BookServlet bookServlet = new BookServlet();
        CategoryServlet categoryServlet = new CategoryServlet();
        OrderServlet orderServlet = new OrderServlet();
        ReviewServlet reviewServlet = new ReviewServlet();

        // Initialize servlets
        authServlet.init();
        bookServlet.init();
        categoryServlet.init();
        orderServlet.init();
        reviewServlet.init();

        Map<String, HttpServlet> routes = new LinkedHashMap<>();
        routes.put("/auth", authServlet);
        routes.put("/books", bookServlet);
        routes.put("/categories", categoryServlet);
        routes.put("/orders", orderServlet);
        routes.put("/reviews", reviewServlet);

        HttpHandler masterHandler = new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                // Add global CORS headers
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
                exchange.getResponseHeaders().set("Access-Control-Max-Age", "3600");

                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    exchange.sendResponseHeaders(200, -1);
                    exchange.close();
                    return;
                }

                String path = exchange.getRequestURI().getPath();
                // Normalize prefix: /booknest/api/... or /api/...
                String subPath = path;
                if (subPath.startsWith("/booknest/api")) {
                    subPath = subPath.substring("/booknest/api".length());
                } else if (subPath.startsWith("/api")) {
                    subPath = subPath.substring("/api".length());
                }

                HttpServlet targetServlet = null;
                String servletPath = "";
                String pathInfo = "";

                for (Map.Entry<String, HttpServlet> entry : routes.entrySet()) {
                    String prefix = entry.getKey();
                    if (subPath.equals(prefix) || subPath.startsWith(prefix + "/")) {
                        targetServlet = entry.getValue();
                        servletPath = prefix;
                        pathInfo = subPath.substring(prefix.length());
                        if (pathInfo.isEmpty()) pathInfo = "/";
                        break;
                    }
                }

                if (targetServlet == null) {
                    byte[] notFound = "{\"error\":\"Endpoint not found\"}".getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
                    exchange.sendResponseHeaders(404, notFound.length);
                    exchange.getResponseBody().write(notFound);
                    exchange.close();
                    return;
                }

                // Buffer request body only if applicable
                byte[] requestBodyBytes;
                String method = exchange.getRequestMethod();
                if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
                    requestBodyBytes = new byte[0];
                } else {
                    requestBodyBytes = exchange.getRequestBody().readAllBytes();
                }

                // Parse query parameters
                Map<String, String[]> queryParams = parseQueryParams(exchange.getRequestURI().getRawQuery());

                // Create response buffer and status holder
                int[] statusHolder = new int[]{200};
                ByteArrayOutputStream responseBuffer = new ByteArrayOutputStream();
                Map<String, List<String>> customHeaders = new HashMap<>();

                final String finalPathInfo = pathInfo;
                final String finalServletPath = servletPath;

                // Proxy HttpServletRequest
                HttpServletRequest req = (HttpServletRequest) Proxy.newProxyInstance(
                    HttpServletRequest.class.getClassLoader(),
                    new Class<?>[]{HttpServletRequest.class},
                    new InvocationHandler() {
                        @Override
                        public Object invoke(Object proxy, Method method, Object[] mArgs) throws Throwable {
                            String name = method.getName();
                            switch (name) {
                                case "getMethod":
                                    return exchange.getRequestMethod();
                                case "getPathInfo":
                                    return finalPathInfo;
                                case "getServletPath":
                                    return finalServletPath;
                                case "getRequestURI":
                                    return exchange.getRequestURI().getPath();
                                case "getParameter":
                                    String paramName = (String) mArgs[0];
                                    String[] vals = queryParams.get(paramName);
                                    return (vals != null && vals.length > 0) ? vals[0] : null;
                                case "getParameterValues":
                                    return queryParams.get((String) mArgs[0]);
                                case "getParameterMap":
                                    return queryParams;
                                case "getParameterNames":
                                    return Collections.enumeration(queryParams.keySet());
                                case "getHeader":
                                    return exchange.getRequestHeaders().getFirst((String) mArgs[0]);
                                case "getHeaderNames":
                                    return Collections.enumeration(exchange.getRequestHeaders().keySet());
                                case "getHeaders":
                                    List<String> hl = exchange.getRequestHeaders().get((String) mArgs[0]);
                                    return Collections.enumeration(hl != null ? hl : Collections.emptyList());
                                case "getContentType":
                                    return exchange.getRequestHeaders().getFirst("Content-Type");
                                case "getContentLength":
                                    return requestBodyBytes.length;
                                case "getContentLengthLong":
                                    return (long) requestBodyBytes.length;
                                case "getCharacterEncoding":
                                    return "UTF-8";
                                case "getReader":
                                    return new BufferedReader(new InputStreamReader(new ByteArrayInputStream(requestBodyBytes), StandardCharsets.UTF_8));
                                case "getInputStream":
                                    ByteArrayInputStream bais = new ByteArrayInputStream(requestBodyBytes);
                                    return new ServletInputStream() {
                                        @Override public boolean isFinished() { return bais.available() == 0; }
                                        @Override public boolean isReady() { return true; }
                                        @Override public void setReadListener(javax.servlet.ReadListener readListener) {}
                                        @Override public int read() { return bais.read(); }
                                    };
                                case "getContextPath":
                                    return "/booknest";
                                case "getServerName":
                                    return "localhost";
                                case "getServerPort":
                                    return port;
                                case "getScheme":
                                    return "http";
                                default:
                                    if (method.getReturnType().equals(boolean.class)) return false;
                                    if (method.getReturnType().equals(int.class)) return 0;
                                    if (method.getReturnType().equals(long.class)) return 0L;
                                    return null;
                            }
                        }
                    }
                );

                PrintWriter[] writerHolder = new PrintWriter[1];

                // Proxy HttpServletResponse
                HttpServletResponse resp = (HttpServletResponse) Proxy.newProxyInstance(
                    HttpServletResponse.class.getClassLoader(),
                    new Class<?>[]{HttpServletResponse.class},
                    new InvocationHandler() {
                        @Override
                        public Object invoke(Object proxy, Method method, Object[] mArgs) throws Throwable {
                            String name = method.getName();
                            switch (name) {
                                case "setStatus":
                                    statusHolder[0] = (Integer) mArgs[0];
                                    return null;
                                case "getStatus":
                                    return statusHolder[0];
                                case "setContentType":
                                    customHeaders.computeIfAbsent("Content-Type", k -> new ArrayList<>()).clear();
                                    customHeaders.get("Content-Type").add((String) mArgs[0]);
                                    return null;
                                case "setHeader":
                                    customHeaders.computeIfAbsent((String) mArgs[0], k -> new ArrayList<>()).clear();
                                    customHeaders.get((String) mArgs[0]).add((String) mArgs[1]);
                                    return null;
                                case "addHeader":
                                    customHeaders.computeIfAbsent((String) mArgs[0], k -> new ArrayList<>()).add((String) mArgs[1]);
                                    return null;
                                case "getWriter":
                                    if (writerHolder[0] == null) {
                                        writerHolder[0] = new PrintWriter(new OutputStreamWriter(responseBuffer, StandardCharsets.UTF_8), true);
                                    }
                                    return writerHolder[0];
                                case "getOutputStream":
                                    return new ServletOutputStream() {
                                        @Override public boolean isReady() { return true; }
                                        @Override public void setWriteListener(WriteListener writeListener) {}
                                        @Override public void write(int b) { responseBuffer.write(b); }
                                    };
                                default:
                                    if (method.getReturnType().equals(boolean.class)) return false;
                                    if (method.getReturnType().equals(int.class)) return 0;
                                    return null;
                            }
                        }
                    }
                );

                try {
                    targetServlet.service(req, resp);
                } catch (Exception e) {
                    e.printStackTrace();
                    statusHolder[0] = 500;
                    responseBuffer.reset();
                    responseBuffer.write(("{\"error\":\"Internal Server Error: " + e.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8));
                }

                if (writerHolder[0] != null) {
                    writerHolder[0].flush();
                }
                responseBuffer.flush();

                // Apply headers
                for (Map.Entry<String, List<String>> header : customHeaders.entrySet()) {
                    for (String val : header.getValue()) {
                        exchange.getResponseHeaders().add(header.getKey(), val);
                    }
                }
                if (!exchange.getResponseHeaders().containsKey("Content-Type")) {
                    exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
                }

                byte[] outBytes = responseBuffer.toByteArray();
                exchange.sendResponseHeaders(statusHolder[0], outBytes.length);
                if (outBytes.length > 0) {
                    OutputStream os = exchange.getResponseBody();
                    os.write(outBytes);
                    os.flush();
                }
                exchange.close();
            }
        };

        server.createContext("/booknest/api", masterHandler);
        server.createContext("/api", masterHandler);

        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();

        System.out.println("=================================================");
        System.out.println("  BookNest Backend REST API Server is Running!   ");
        System.out.println("  Port: " + port);
        System.out.println("  Base URL: http://0.0.0.0:" + port + "/booknest/api  ");
        System.out.println("  Endpoints available:                           ");
        System.out.println("    /api/auth/*                                  ");
        System.out.println("    /api/books/*                                 ");
        System.out.println("    /api/categories/*                            ");
        System.out.println("    /api/orders/*                                ");
        System.out.println("    /api/reviews/*                               ");
        System.out.println("=================================================");
    }

    private static Map<String, String[]> parseQueryParams(String rawQuery) {
        Map<String, String[]> map = new HashMap<>();
        if (rawQuery == null || rawQuery.trim().isEmpty()) return map;
        for (String pair : rawQuery.split("&")) {
            int idx = pair.indexOf("=");
            try {
                String key = idx > 0 ? URLDecoder.decode(pair.substring(0, idx), "UTF-8") : pair;
                String val = idx > 0 && pair.length() > idx + 1 ? URLDecoder.decode(pair.substring(idx + 1), "UTF-8") : "";
                map.put(key, new String[]{val});
            } catch (Exception ignored) {}
        }
        return map;
    }
}
