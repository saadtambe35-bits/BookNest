package com.booknest.servlets;

import com.booknest.util.DBConnection;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

/**
 * GET /api/categories → returns all categories.
 */
@WebServlet("/api/categories")
public class CategoryServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            PreparedStatement ps = conn.prepareStatement("SELECT * FROM categories ORDER BY name");
            ResultSet rs = ps.executeQuery();

            List<Map<String, Object>> categories = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> cat = new LinkedHashMap<>();
                cat.put("id",          rs.getInt("id"));
                cat.put("name",        rs.getString("name"));
                cat.put("description", rs.getString("description"));
                categories.add(cat);
            }
            out.print(gson.toJson(categories));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) { resp.setStatus(200); }
}
