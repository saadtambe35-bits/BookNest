package com.booknest.servlets;

import com.booknest.model.User;
import com.booknest.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handles POST /api/auth/register and POST /api/auth/login.
 */
@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String pathInfo = req.getPathInfo(); // "/register" or "/login"
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String body = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);

        if (pathInfo == null) {
            resp.setStatus(404);
            out.print("{\"error\":\"Unknown endpoint\"}");
            return;
        }

        switch (pathInfo) {
            case "/register":
                handleRegister(json, resp, out);
                break;
            case "/login":
                handleLogin(json, resp, out);
                break;
            default:
                resp.setStatus(404);
                out.print("{\"error\":\"Not found\"}");
        }
    }

    private void handleRegister(JsonObject json, HttpServletResponse resp, PrintWriter out) throws IOException {
        String name  = getStr(json, "name");
        String email = getStr(json, "email");
        String pass  = getStr(json, "password");

        if (name.isEmpty() || email.isEmpty() || pass.isEmpty()) {
            resp.setStatus(400);
            out.print("{\"error\":\"name, email and password are required\"}");
            return;
        }

        try {
            Connection conn = DBConnection.getInstance().getConnection();

            // Check duplicate email
            PreparedStatement check = conn.prepareStatement("SELECT id FROM users WHERE email=?");
            check.setString(1, email);
            ResultSet rs = check.executeQuery();
            if (rs.next()) {
                resp.setStatus(409);
                out.print("{\"error\":\"Email already registered\"}");
                return;
            }

            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO users (name, email, password, role) VALUES (?,?,?,'CUSTOMER')",
                Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            ps.setString(2, email);
            ps.setString(3, pass); // plain-text for prototype
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            keys.next();
            int newId = keys.getInt(1);

            Map<String, Object> response = new HashMap<>();
            Map<String, Object> user     = new HashMap<>();
            user.put("id",    newId);
            user.put("name",  name);
            user.put("email", email);
            user.put("role",  "CUSTOMER");
            response.put("user", user);

            resp.setStatus(201);
            out.print(gson.toJson(response));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"Database error: " + e.getMessage() + "\"}");
        }
    }

    private void handleLogin(JsonObject json, HttpServletResponse resp, PrintWriter out) throws IOException {
        String email = getStr(json, "email");
        String pass  = getStr(json, "password");

        if (email.isEmpty() || pass.isEmpty()) {
            resp.setStatus(400);
            out.print("{\"error\":\"email and password are required\"}");
            return;
        }

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            PreparedStatement ps = conn.prepareStatement(
                "SELECT id, name, email, password, role FROM users WHERE email=?");
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (!rs.next()) {
                resp.setStatus(401);
                out.print("{\"error\":\"Invalid email or password\"}");
                return;
            }

            String storedPass = rs.getString("password");
            if (!storedPass.equals(pass)) {
                resp.setStatus(401);
                out.print("{\"error\":\"Invalid email or password\"}");
                return;
            }

            Map<String, Object> response = new HashMap<>();
            Map<String, Object> user     = new HashMap<>();
            user.put("id",    rs.getInt("id"));
            user.put("name",  rs.getString("name"));
            user.put("email", rs.getString("email"));
            user.put("role",  rs.getString("role"));
            response.put("user", user);

            resp.setStatus(200);
            out.print(gson.toJson(response));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"Database error: " + e.getMessage() + "\"}");
        }
    }

    // ---- helpers ----
    private String getStr(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return "";
        return obj.get(key).getAsString().trim();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(200);
    }
}
