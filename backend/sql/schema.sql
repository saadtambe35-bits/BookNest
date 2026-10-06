-- ============================================================
-- BookNest Database Schema
-- ============================================================

DROP DATABASE IF EXISTS booknest;
CREATE DATABASE booknest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE booknest;

-- 1. Users
CREATE TABLE users (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(120) NOT NULL,
    email    VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role     ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER'
);

-- 2. Categories
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL UNIQUE,
    description TEXT
);

-- 3. Books
CREATE TABLE books (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT          NOT NULL,
    title       VARCHAR(255) NOT NULL,
    author      VARCHAR(180) NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    stock       INT          NOT NULL DEFAULT 0,
    description TEXT,
    cover_url   TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. Cart
CREATE TABLE cart (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id  INT NOT NULL,
    book_id  INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE KEY uq_user_book (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 5. Orders
CREATE TABLE orders (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT           NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status       ENUM('PLACED','CONFIRMED','SHIPPED','DELIVERED') NOT NULL DEFAULT 'PLACED',
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. Order Items
CREATE TABLE order_items (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT           NOT NULL,
    book_id  INT           NOT NULL,
    quantity INT           NOT NULL,
    price    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (book_id)  REFERENCES books(id)
);

-- 7. Payments
CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT           NOT NULL UNIQUE,
    amount          DECIMAL(10,2) NOT NULL,
    status          VARCHAR(30)   NOT NULL DEFAULT 'SUCCESS',
    transaction_ref VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 8. Reviews
CREATE TABLE reviews (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    book_id    INT  NOT NULL,
    user_id    INT  NOT NULL,
    rating     INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_book_review (user_id, book_id),
    FOREIGN KEY (book_id)  REFERENCES books(id),
    FOREIGN KEY (user_id)  REFERENCES users(id)
);
