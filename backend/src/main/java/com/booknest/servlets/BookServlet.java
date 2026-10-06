package com.booknest.servlets;

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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles all /api/books/* endpoints.
 */
@WebServlet("/api/books/*")
public class BookServlet extends HttpServlet {

    private final Gson gson = new Gson();

    // -------------------------------------------------------------------------
    // GET /api/books            → list (search, category_id)
    // GET /api/books/{id}       → single book with reviews
    // -------------------------------------------------------------------------
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();

        try {
            Connection conn = DBConnection.getInstance().getConnection();

            if (pathInfo == null || pathInfo.equals("/")) {
                // List books
                String search     = req.getParameter("search");
                String catIdParam = req.getParameter("category_id");

                StringBuilder sql = new StringBuilder(
                    "SELECT b.*, c.name AS category_name " +
                    "FROM books b JOIN categories c ON b.category_id = c.id WHERE 1=1");
                List<Object> params = new ArrayList<>();

                if (search != null && !search.trim().isEmpty()) {
                    sql.append(" AND (b.title LIKE ? OR b.author LIKE ?)");
                    params.add("%" + search.trim() + "%");
                    params.add("%" + search.trim() + "%");
                }
                if (catIdParam != null && !catIdParam.trim().isEmpty()) {
                    sql.append(" AND b.category_id = ?");
                    params.add(Integer.parseInt(catIdParam.trim()));
                }
                sql.append(" ORDER BY b.id");

                PreparedStatement ps = conn.prepareStatement(sql.toString());
                for (int i = 0; i < params.size(); i++) {
                    Object p = params.get(i);
                    if (p instanceof String) ps.setString(i + 1, (String) p);
                    else ps.setInt(i + 1, (Integer) p);
                }

                ResultSet rs = ps.executeQuery();
                List<Map<String, Object>> books = new ArrayList<>();
                while (rs.next()) {
                    books.add(bookRowToMap(rs));
                }
                out.print(gson.toJson(books));

            } else {
                // Single book with reviews
                int id;
                try { id = Integer.parseInt(pathInfo.substring(1)); }
                catch (NumberFormatException e) {
                    resp.setStatus(400);
                    out.print("{\"error\":\"Invalid book id\"}");
                    return;
                }

                PreparedStatement ps = conn.prepareStatement(
                    "SELECT b.*, c.name AS category_name " +
                    "FROM books b JOIN categories c ON b.category_id = c.id WHERE b.id = ?");
                ps.setInt(1, id);
                ResultSet rs = ps.executeQuery();

                if (!rs.next()) {
                    resp.setStatus(404);
                    out.print("{\"error\":\"Book not found\"}");
                    return;
                }
                Map<String, Object> book = bookRowToMap(rs);

                // Fetch reviews
                PreparedStatement rps = conn.prepareStatement(
                    "SELECT r.*, u.name AS user_name " +
                    "FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.book_id = ? ORDER BY r.created_at DESC");
                rps.setInt(1, id);
                ResultSet rrs = rps.executeQuery();
                List<Map<String, Object>> reviews = new ArrayList<>();
                while (rrs.next()) {
                    Map<String, Object> rev = new LinkedHashMap<>();
                    rev.put("id",         rrs.getInt("id"));
                    rev.put("rating",     rrs.getInt("rating"));
                    rev.put("comment",    rrs.getString("comment"));
                    rev.put("created_at", rrs.getString("created_at"));
                    rev.put("user_name",  rrs.getString("user_name"));
                    rev.put("user_id",    rrs.getInt("user_id"));
                    reviews.add(rev);
                }
                book.put("reviews", reviews);

                out.print(gson.toJson(book));
            }

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/books  → add book (admin)
    // -------------------------------------------------------------------------
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String body = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO books (category_id, title, author, price, stock, description, cover_url) VALUES (?,?,?,?,?,?,?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1,    getInt(json, "category_id"));
            ps.setString(2, getStr(json, "title"));
            ps.setString(3, getStr(json, "author"));
            ps.setDouble(4, getDbl(json, "price"));
            ps.setInt(5,    getInt(json, "stock"));
            ps.setString(6, getStr(json, "description"));
            ps.setString(7, getStr(json, "cover_url"));
            ps.executeUpdate();

            ResultSet keys = ps.getGeneratedKeys();
            keys.next();
            int newId = keys.getInt(1);

            PreparedStatement fetch = conn.prepareStatement(
                "SELECT b.*, c.name AS category_name FROM books b JOIN categories c ON b.category_id=c.id WHERE b.id=?");
            fetch.setInt(1, newId);
            ResultSet rs = fetch.executeQuery();
            rs.next();

            resp.setStatus(201);
            out.print(gson.toJson(bookRowToMap(rs)));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/books/{id}  → update book (admin)
    // -------------------------------------------------------------------------
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(400); out.print("{\"error\":\"Book id required\"}"); return;
        }

        int id;
        try { id = Integer.parseInt(pathInfo.substring(1)); }
        catch (NumberFormatException e) {
            resp.setStatus(400); out.print("{\"error\":\"Invalid id\"}"); return;
        }

        String body = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            PreparedStatement ps = conn.prepareStatement(
                "UPDATE books SET category_id=?, title=?, author=?, price=?, stock=?, description=?, cover_url=? WHERE id=?");
            ps.setInt(1,    getInt(json, "category_id"));
            ps.setString(2, getStr(json, "title"));
            ps.setString(3, getStr(json, "author"));
            ps.setDouble(4, getDbl(json, "price"));
            ps.setInt(5,    getInt(json, "stock"));
            ps.setString(6, getStr(json, "description"));
            ps.setString(7, getStr(json, "cover_url"));
            ps.setInt(8, id);
            int rows = ps.executeUpdate();

            if (rows == 0) { resp.setStatus(404); out.print("{\"error\":\"Book not found\"}"); return; }

            PreparedStatement fetch = conn.prepareStatement(
                "SELECT b.*, c.name AS category_name FROM books b JOIN categories c ON b.category_id=c.id WHERE b.id=?");
            fetch.setInt(1, id);
            ResultSet rs = fetch.executeQuery();
            rs.next();
            out.print(gson.toJson(bookRowToMap(rs)));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/books/{id}  → remove book (admin)
    // -------------------------------------------------------------------------
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(400); out.print("{\"error\":\"Book id required\"}"); return;
        }

        int id;
        try { id = Integer.parseInt(pathInfo.substring(1)); }
        catch (NumberFormatException e) {
            resp.setStatus(400); out.print("{\"error\":\"Invalid id\"}"); return;
        }

        try {
            Connection conn = DBConnection.getInstance().getConnection();

            // Remove from cart first to avoid FK violation
            PreparedStatement delCart = conn.prepareStatement("DELETE FROM cart WHERE book_id=?");
            delCart.setInt(1, id);
            delCart.executeUpdate();

            PreparedStatement ps = conn.prepareStatement("DELETE FROM books WHERE id=?");
            ps.setInt(1, id);
            int rows = ps.executeUpdate();

            if (rows == 0) { resp.setStatus(404); out.print("{\"error\":\"Book not found\"}"); return; }
            out.print("{\"success\":true}");

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) { resp.setStatus(200); }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private Map<String, Object> bookRowToMap(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            rs.getInt("id"));
        m.put("category_id",   rs.getInt("category_id"));
        m.put("category_name", rs.getString("category_name"));
        m.put("title",         rs.getString("title"));
        m.put("author",        rs.getString("author"));
        m.put("price",         rs.getDouble("price"));
        m.put("stock",         rs.getInt("stock"));
        m.put("description",   rs.getString("description"));
        m.put("cover_url",     rs.getString("cover_url"));
        return m;
    }

    private String getStr(JsonObject o, String k) {
        return (o != null && o.has(k) && !o.get(k).isJsonNull()) ? o.get(k).getAsString() : "";
    }
    private int getInt(JsonObject o, String k) {
        return (o != null && o.has(k) && !o.get(k).isJsonNull()) ? o.get(k).getAsInt() : 0;
    }
    private double getDbl(JsonObject o, String k) {
        return (o != null && o.has(k) && !o.get(k).isJsonNull()) ? o.get(k).getAsDouble() : 0.0;
    }
}
