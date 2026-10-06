# 📚 BookNest — Online Book Store

Production-grade full-stack online bookstore prototype built with Java HTTP Servlets, JDBC, REST API, React.js (Vite), and Tailwind CSS.

---

## 🚀 Quick Start (Running Both Servers)

### Prerequisites
- **Java 11+** (`java`, `javac`)
- **Node.js 18+** (`node`, `npm`)
- *(Optional)* MySQL Server (port 3306) — *If MySQL is not installed/running, BookNest automatically initializes an embedded H2 database in MySQL compatibility mode with pre-seeded data.*

---

### 1. Start the Java Backend (Port 8080)
From the project root:
```powershell
# Compile the backend:
$jars = (Get-ChildItem -Path "backend\lib\*.jar" | ForEach-Object { $_.FullName }) -join ";"
javac -cp $jars -d "backend\target\classes" (Get-ChildItem -Path "backend\src\main\java" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName)

# Launch the backend server:
java -cp "backend/target/classes;backend/lib/*" com.booknest.AppServer
```
Backend will be live at: **`http://localhost:8080/booknest/api`**

---

### 2. Start the React Frontend (Port 5173)
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5173/`**

---

## 🔐 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@booknest.com` | `admin123` | Full Admin Dashboard, Book Management (CRUD), Order Statuses |
| **Customer** | `customer@booknest.com` | `customer123` | Book Catalog, Cart, Checkout, Order Tracking, Book Reviews |

---

## 🏗️ Architecture & Features

### Backend (Java HTTP Servlets & JDBC)
- **`AuthServlet`** (`/api/auth/*`): Login & registration with role-based JWT payload (`CUSTOMER` vs `ADMIN`).
- **`BookServlet`** (`/api/books/*`): Book catalog, pagination, keyword search, category filtering, and Admin CRUD.
- **`CategoryServlet`** (`/api/categories/*`): Category listing and management.
- **`OrderServlet`** (`/api/orders/*`): ACID-compliant transactional checkout with stock verification and atomic balance updates.
- **`ReviewServlet`** (`/api/reviews/*`): Review submission, 5-star ratings, and duplicate prevention.
- **`CorsFilter` & `AppServer`**: Integrated CORS support and embedded HTTP servlet container.

### Persistence (8 Relational Tables)
- `users`: ID, name, email, password, role (`CUSTOMER`, `ADMIN`)
- `categories`: ID, name, description
- `books`: ID, category_id, title, author, price, stock, description, cover_url
- `cart`: ID, user_id, book_id, quantity
- `orders`: ID, user_id, total_amount, status (`PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `order_items`: ID, order_id, book_id, quantity, price
- `payments`: ID, order_id, amount, status, transaction_ref
- `reviews`: ID, book_id, user_id, rating (1–5), comment, created_at

### Frontend (React + Vite + Tailwind CSS + Lucide)
- **Hero & Catalog Page**: Dynamic category pills, live keyword search, rating stars, and responsive cards.
- **Book Details Page**: High-resolution covers, stock badges, quantity counter, and interactive review submission.
- **Shopping Cart & Checkout**: Real-time summary, shipping address capture, payment method selection (Card / UPI / COD).
- **Order Tracking**: Visual 4-step progress stepper (`PLACED` ➔ `CONFIRMED` ➔ `SHIPPED` ➔ `DELIVERED`).
- **Admin Suite**: KPI metrics dashboard, live stock management, inline book editor, and order status updater.
