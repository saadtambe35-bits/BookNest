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
 * Handles /api/orders/* endpoints.
 *
 * POST /api/orders/checkout       - Place order with ACID transaction
 * GET  /api/orders/my-orders?userId=X  - Customer order history
 * GET  /api/orders/all            - All orders (admin)
 * PUT  /api/orders/{id}/status    - Update order status (admin)
 */
@WebServlet("/api/orders/*")
public class OrderServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo(); // "/my-orders" or "/all"

        try {
            Connection conn = DBConnection.getInstance().getConnection();

            if ("/my-orders".equals(pathInfo)) {
                String userIdParam = req.getParameter("userId");
                if (userIdParam == null) {
                    resp.setStatus(400); out.print("{\"error\":\"userId required\"}"); return;
                }
                int userId = Integer.parseInt(userIdParam);
                out.print(gson.toJson(fetchOrdersForUser(conn, userId)));

            } else if ("/all".equals(pathInfo)) {
                out.print(gson.toJson(fetchAllOrders(conn)));

            } else {
                resp.setStatus(404);
                out.print("{\"error\":\"Unknown orders endpoint\"}");
            }

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (!"/checkout".equals(pathInfo)) {
            resp.setStatus(404); out.print("{\"error\":\"Not found\"}"); return;
        }

        String body = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);

        int userId = json.has("userId") ? json.get("userId").getAsInt() : 0;
        if (userId == 0) {
            resp.setStatus(400); out.print("{\"error\":\"userId required\"}"); return;
        }

        // Parse cart items from body: [{bookId, quantity, price}, ...]
        com.google.gson.JsonArray cartArray = json.has("items") ? json.getAsJsonArray("items") : null;
        if (cartArray == null || cartArray.size() == 0) {
            resp.setStatus(400); out.print("{\"error\":\"Cart is empty\"}"); return;
        }

        Connection conn = null;
        try {
            conn = DBConnection.newConnection();
            conn.setAutoCommit(false);  // BEGIN TRANSACTION

            double totalAmount = 0;

            // ── Step 1: Validate stock for every item ──────────────────────
            List<Map<String, Object>> validatedItems = new ArrayList<>();
            for (int i = 0; i < cartArray.size(); i++) {
                JsonObject item  = cartArray.get(i).getAsJsonObject();
                int bookId       = item.get("bookId").getAsInt();
                int qty          = item.get("quantity").getAsInt();
                double unitPrice = item.get("price").getAsDouble();

                PreparedStatement stockCheck = conn.prepareStatement(
                    "SELECT id, title, stock FROM books WHERE id = ? FOR UPDATE");
                stockCheck.setInt(1, bookId);
                ResultSet rs = stockCheck.executeQuery();

                if (!rs.next()) {
                    conn.rollback();
                    resp.setStatus(404);
                    out.print("{\"error\":\"Book id " + bookId + " not found\"}");
                    return;
                }

                int availableStock = rs.getInt("stock");
                String bookTitle   = rs.getString("title");

                if (availableStock < qty) {
                    conn.rollback();
                    resp.setStatus(409);
                    out.print("{\"error\":\"Insufficient stock for '" + bookTitle +
                              "'. Available: " + availableStock + "\"}");
                    return;
                }

                Map<String, Object> validItem = new HashMap<>();
                validItem.put("bookId",    bookId);
                validItem.put("quantity",  qty);
                validItem.put("unitPrice", unitPrice);
                validatedItems.add(validItem);

                totalAmount += qty * unitPrice;
            }

            // ── Step 2: Insert order ───────────────────────────────────────
            PreparedStatement insertOrder = conn.prepareStatement(
                "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'PLACED')",
                Statement.RETURN_GENERATED_KEYS);
            insertOrder.setInt(1, userId);
            insertOrder.setDouble(2, totalAmount);
            insertOrder.executeUpdate();

            ResultSet orderKeys = insertOrder.getGeneratedKeys();
            orderKeys.next();
            int orderId = orderKeys.getInt(1);

            // ── Step 3: Insert order_items and decrement stock ─────────────
            for (Map<String, Object> item : validatedItems) {
                int    bookId    = (int)    item.get("bookId");
                int    qty       = (int)    item.get("quantity");
                double unitPrice = (double) item.get("unitPrice");

                PreparedStatement insertItem = conn.prepareStatement(
                    "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?,?,?,?)");
                insertItem.setInt(1, orderId);
                insertItem.setInt(2, bookId);
                insertItem.setInt(3, qty);
                insertItem.setDouble(4, unitPrice);
                insertItem.executeUpdate();

                PreparedStatement deductStock = conn.prepareStatement(
                    "UPDATE books SET stock = stock - ? WHERE id = ?");
                deductStock.setInt(1, qty);
                deductStock.setInt(2, bookId);
                deductStock.executeUpdate();
            }

            // ── Step 4: Insert payment record ──────────────────────────────
            String transactionRef = "TXN_" + System.currentTimeMillis();
            PreparedStatement insertPayment = conn.prepareStatement(
                "INSERT INTO payments (order_id, amount, status, transaction_ref) VALUES (?,?,'SUCCESS',?)");
            insertPayment.setInt(1, orderId);
            insertPayment.setDouble(2, totalAmount);
            insertPayment.setString(3, transactionRef);
            insertPayment.executeUpdate();

            // ── Step 5: Clear cart ─────────────────────────────────────────
            PreparedStatement clearCart = conn.prepareStatement(
                "DELETE FROM cart WHERE user_id = ?");
            clearCart.setInt(1, userId);
            clearCart.executeUpdate();

            conn.commit();  // COMMIT

            // ── Return response ────────────────────────────────────────────
            Map<String, Object> response = new HashMap<>();
            response.put("success",        true);
            response.put("orderId",        orderId);
            response.put("totalAmount",    totalAmount);
            response.put("transactionRef", transactionRef);

            resp.setStatus(201);
            out.print(gson.toJson(response));

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            resp.setStatus(500);
            out.print("{\"error\":\"Transaction failed: " + e.getMessage() + "\"}");
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // Expected: /api/orders/{id}/status
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) { resp.setStatus(400); out.print("{\"error\":\"Invalid path\"}"); return; }

        String[] parts = pathInfo.split("/");
        // parts[0]="" parts[1]=id parts[2]="status"
        if (parts.length < 3 || !"status".equals(parts[2])) {
            resp.setStatus(400); out.print("{\"error\":\"Expected /{id}/status\"}"); return;
        }

        int orderId;
        try { orderId = Integer.parseInt(parts[1]); }
        catch (NumberFormatException e) { resp.setStatus(400); out.print("{\"error\":\"Invalid id\"}"); return; }

        String body  = req.getReader().lines().collect(Collectors.joining());
        JsonObject json = gson.fromJson(body, JsonObject.class);
        String newStatus = json.has("status") ? json.get("status").getAsString() : "";

        List<String> validStatuses = Arrays.asList("PLACED","CONFIRMED","SHIPPED","DELIVERED");
        if (!validStatuses.contains(newStatus)) {
            resp.setStatus(400); out.print("{\"error\":\"Invalid status\"}"); return;
        }

        try {
            Connection conn = DBConnection.getInstance().getConnection();
            PreparedStatement ps = conn.prepareStatement(
                "UPDATE orders SET status=? WHERE id=?");
            ps.setString(1, newStatus);
            ps.setInt(2, orderId);
            int rows = ps.executeUpdate();

            if (rows == 0) { resp.setStatus(404); out.print("{\"error\":\"Order not found\"}"); return; }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("orderId", orderId);
            result.put("status",  newStatus);
            out.print(gson.toJson(result));

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) { resp.setStatus(200); }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private List<Map<String, Object>> fetchOrdersForUser(Connection conn, int userId) throws SQLException {
        PreparedStatement ps = conn.prepareStatement(
            "SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id=u.id " +
            "WHERE o.user_id=? ORDER BY o.created_at DESC");
        ps.setInt(1, userId);
        return buildOrderList(conn, ps);
    }

    private List<Map<String, Object>> fetchAllOrders(Connection conn) throws SQLException {
        PreparedStatement ps = conn.prepareStatement(
            "SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id=u.id " +
            "ORDER BY o.created_at DESC");
        return buildOrderList(conn, ps);
    }

    private List<Map<String, Object>> buildOrderList(Connection conn, PreparedStatement ps) throws SQLException {
        ResultSet rs = ps.executeQuery();
        List<Map<String, Object>> orders = new ArrayList<>();
        while (rs.next()) {
            Map<String, Object> order = new LinkedHashMap<>();
            int orderId = rs.getInt("id");
            order.put("id",            orderId);
            order.put("user_id",       rs.getInt("user_id"));
            order.put("customer_name", rs.getString("customer_name"));
            order.put("total_amount",  rs.getDouble("total_amount"));
            order.put("status",        rs.getString("status"));
            order.put("created_at",    rs.getString("created_at"));
            order.put("items",         fetchOrderItems(conn, orderId));
            orders.add(order);
        }
        return orders;
    }

    private List<Map<String, Object>> fetchOrderItems(Connection conn, int orderId) throws SQLException {
        PreparedStatement ps = conn.prepareStatement(
            "SELECT oi.*, b.title, b.cover_url FROM order_items oi " +
            "JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?");
        ps.setInt(1, orderId);
        ResultSet rs = ps.executeQuery();
        List<Map<String, Object>> items = new ArrayList<>();
        while (rs.next()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id",        rs.getInt("id"));
            item.put("book_id",   rs.getInt("book_id"));
            item.put("title",     rs.getString("title"));
            item.put("cover_url", rs.getString("cover_url"));
            item.put("quantity",  rs.getInt("quantity"));
            item.put("price",     rs.getDouble("price"));
            items.add(item);
        }
        return items;
    }
}
