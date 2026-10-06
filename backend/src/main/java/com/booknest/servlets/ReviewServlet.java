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
 * POST /api/reviews  → Submit a review for a book.
 */
@WebServlet("/api/reviews")
public class ReviewServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String body = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);

        int bookId = json.has("book_id") ? json.get("book_id").getAsInt() : (json.has("bookId") ? json.get("bookId").getAsInt() : 0);
        int userId = json.has("user_id") ? json.get("user_id").getAsInt() : (json.has("userId") ? json.get("userId").getAsInt() : 0);
        int rating = json.has("rating")  ? json.get("rating").getAsInt()  : 0;
        String comment = json.has("comment") ? json.get("comment").getAsString() : "";

        if (bookId == 0 || userId == 0 || rating < 1 || rating > 5) {
            resp.setStatus(400);
            out.print("{\"error\":\"book_id/bookId, user_id/userId and rating (1-5) are required\"}");
            return;
        }

        try {
            Connection conn = DBConnection.getInstance().getConnection();

            // Check for duplicate review
            PreparedStatement check = conn.prepareStatement(
                "SELECT id FROM reviews WHERE user_id=? AND book_id=?");
            check.setInt(1, userId);
            check.setInt(2, bookId);
            ResultSet rs = check.executeQuery();
            if (rs.next()) {
                resp.setStatus(409);
                out.print("{\"error\":\"You have already reviewed this book\"}");
                return;
            }

            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?,?,?,?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, bookId);
            ps.setInt(2, userId);
            ps.setInt(3, rating);
            ps.setString(4, comment);
            ps.executeUpdate();

            ResultSet keys = ps.getGeneratedKeys();
            keys.next();
            int newId = keys.getInt(1);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id",      newId);
            result.put("book_id", bookId);
            result.put("user_id", userId);
            result.put("rating",  rating);
            result.put("comment", comment);

            resp.setStatus(201);
            out.print(gson.toJson(result));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) { resp.setStatus(200); }
}
