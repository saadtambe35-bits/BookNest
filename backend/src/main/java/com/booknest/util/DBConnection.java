package com.booknest.util;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Singleton JDBC connection utility for BookNest.
 * Connects to MySQL on localhost:3306 if available, or falls back to an embedded
 * H2 database in MySQL compatibility mode with automatic schema and seed initialization.
 */
public class DBConnection {

    private static String getMysqlUrl() {
        String env = System.getenv("DB_URL");
        if (env == null || env.isEmpty()) env = System.getenv("MYSQL_URL");
        if (env == null || env.isEmpty()) env = System.getenv("DATABASE_URL");
        if (env != null && !env.isEmpty()) return env;
        return "jdbc:mysql://localhost:3306/booknest?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&connectTimeout=1000&socketTimeout=1000";
    }

    private static String getMysqlUser() {
        String env = System.getenv("DB_USER");
        if (env == null || env.isEmpty()) env = System.getenv("MYSQL_USER");
        if (env != null && !env.isEmpty()) return env;
        return "root";
    }

    private static String getMysqlPass() {
        String env = System.getenv("DB_PASSWORD");
        if (env == null || env.isEmpty()) env = System.getenv("MYSQL_PASSWORD");
        if (env != null && !env.isEmpty()) return env;
        return "root";
    }

    private static final String H2_URL     = "jdbc:h2:./backend/data/booknest;MODE=MySQL;DATABASE_TO_LOWER=TRUE";
    private static final String H2_USER    = "sa";
    private static final String H2_PASS    = "";

    private static boolean useH2 = false;
    private static boolean initialized = false;

    private static DBConnection instance;
    private Connection connection;

    private DBConnection() {
        this.connection = createConnection();
    }

    private static synchronized Connection createConnection() {
        if (!useH2) {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                Connection c = DriverManager.getConnection(getMysqlUrl(), getMysqlUser(), getMysqlPass());
                System.out.println("[BookNest DB] Connected to MySQL database");
                ensureSchemaAndSeed(c);
                return c;
            } catch (Exception e) {
                System.out.println("[BookNest DB] MySQL not available. Switching to embedded H2 (MySQL mode)...");
                useH2 = true;
            }
        }

        try {
            Class.forName("org.h2.Driver");
            new File("backend/data").mkdirs();
            Connection c = DriverManager.getConnection(H2_URL, H2_USER, H2_PASS);
            ensureSchemaAndSeed(c);
            return c;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to connect to database: " + ex.getMessage(), ex);
        }
    }

    private static synchronized void ensureSchemaAndSeed(Connection conn) {
        if (initialized) return;
        boolean exists = false;
        try (Statement s = conn.createStatement()) {
            s.executeQuery("SELECT 1 FROM books LIMIT 1");
            exists = true;
        } catch (Exception notFound) {
            exists = false;
        }

        if (!exists) {
            System.out.println("[BookNest DB] Initializing schema and seed data in embedded database...");
            executeSqlScript(conn, "backend/sql/schema.sql");
            executeSqlScript(conn, "backend/sql/seed.sql");
            System.out.println("[BookNest DB] Database initialized successfully.");
        }
        initialized = true;
    }

    private static void executeSqlScript(Connection conn, String scriptPath) {
        try {
            Path p = Paths.get(scriptPath);
            if (!Files.exists(p)) {
                // try relative from backend or root
                p = Paths.get("sql/" + Paths.get(scriptPath).getFileName().toString());
            }
            if (!Files.exists(p)) return;

            String content = Files.readString(p);
            Statement stmt = conn.createStatement();
            for (String part : content.split(";")) {
                StringBuilder clean = new StringBuilder();
                for (String line : part.split("\n")) {
                    String tl = line.trim();
                    if (!tl.startsWith("--")) clean.append(line).append("\n");
                }
                String trimmed = clean.toString().trim();
                if (trimmed.isEmpty()) continue;
                if (trimmed.toUpperCase().startsWith("DROP DATABASE") ||
                    trimmed.toUpperCase().startsWith("CREATE DATABASE") ||
                    trimmed.toUpperCase().startsWith("USE ")) {
                    continue;
                }
                try {
                    stmt.execute(trimmed);
                } catch (SQLException sqle) {
                    // ignore if already exists or constraint already applied
                }
            }
        } catch (Exception e) {
            System.err.println("[BookNest DB] Failed reading script " + scriptPath + ": " + e.getMessage());
        }
    }

    public static synchronized DBConnection getInstance() {
        try {
            if (instance == null || instance.connection == null || instance.connection.isClosed()) {
                instance = new DBConnection();
            }
        } catch (SQLException e) {
            instance = new DBConnection();
        }
        return instance;
    }

    public Connection getConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                connection = createConnection();
            }
        } catch (SQLException e) {
            connection = createConnection();
        }
        return connection;
    }

    public static Connection newConnection() throws SQLException {
        if (!useH2) {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                return DriverManager.getConnection(getMysqlUrl(), getMysqlUser(), getMysqlPass());
            } catch (Exception e) {
                useH2 = true;
            }
        }
        try {
            Class.forName("org.h2.Driver");
            Connection c = DriverManager.getConnection(H2_URL, H2_USER, H2_PASS);
            ensureSchemaAndSeed(c);
            return c;
        } catch (ClassNotFoundException e) {
            throw new SQLException("H2 driver not found", e);
        }
    }
}
