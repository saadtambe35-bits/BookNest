# 🚀 BookNest Deployment Guide: Vercel & Render

This guide walks you through hosting **BookNest** with:
- **Frontend (React / Vite):** Hosted on **Vercel**
- **Backend (Java HTTP Servlets / REST API):** Hosted on **Render** (via Docker)

---

## 📋 Overview of Setup

```
[ User Browser ]
       │
       ▼
[ Vercel CDN ] ─── React SPA (HTML/JS/CSS)
       │
       ▼ (REST API requests via VITE_API_URL)
[ Render Web Service ] ─── Java AppServer (Docker)
       │
       ▼
[ Database ] ─── Embedded H2 (MySQL Mode) OR Remote MySQL
```

---

## Step 1: Push Your Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `booknest`).
2. Run the following commands from your local project root (`c:\Users\muham\Videos\Java\BookNest`):

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your `booknest` repository.
4. Render will automatically detect the `Dockerfile` and `render.yaml`.
5. Fill in the service details:
   - **Name:** `booknest-backend`
   - **Region:** Choose closest region (e.g. *Oregon*, *Frankfurt*, *Singapore*)
   - **Branch:** `main`
   - **Runtime:** `Docker` (or select from Blueprint)
   - **Instance Type:** **Free**
6. Click **Create Web Service**.
7. Render will build the Docker container and start the server. Once the status shows **Live**, note your public backend URL:
   - Example: `https://booknest-backend-xyz.onrender.com`
8. Verify the backend by opening this URL in your browser:
   - `https://booknest-backend-xyz.onrender.com/booknest/api/categories`
   - *(You should see the JSON list of categories!)*

> 💡 **Note on Database:** By default, BookNest runs with an embedded persistent database in MySQL compatibility mode with pre-seeded books, users, and categories. If you want to connect a dedicated external MySQL instance, simply add these Environment Variables in your Render Dashboard:
> - `DB_URL` = `jdbc:mysql://<your-mysql-host>:3306/<database>?useSSL=true`
> - `DB_USER` = `<your-username>`
> - `DB_PASSWORD` = `<your-password>`

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** ➔ **Project**.
3. Import your `booknest` GitHub repository.
4. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
5. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://booknest-backend-xyz.onrender.com/booknest/api` *(replace with your actual Render URL from Step 2)*
6. Click **Deploy**.
7. In ~30 seconds, your site will be live at `https://booknest-xxxx.vercel.app`!

---

## Step 4: Verification & Demo Logins

Visit your Vercel URL to test the full bookstore:
- **Browse Catalog:** Check categories, filters, search, and book covers.
- **Customer Account:**
  - Email: `customer@booknest.com`
  - Password: `customer123`
  - Test: Add book to cart ➔ Checkout ➔ Track Order.
- **Admin Account:**
  - Email: `admin@booknest.com`
  - Password: `admin123`
  - Test: View Dashboard metrics ➔ Add/Edit books ➔ Update order statuses.

---

## 🛠️ Summary of Deployment Files Created

| File | Purpose |
|---|---|
| [`Dockerfile`](file:///C:/Users/muham/Videos/Java/BookNest/Dockerfile) | Multi-stage Docker container build for Render (JDK 17 + JRE 17) |
| [`render.yaml`](file:///C:/Users/muham/Videos/Java/BookNest/render.yaml) | Render Infrastructure-as-Code Blueprint |
| [`frontend/vercel.json`](file:///C:/Users/muham/Videos/Java/BookNest/frontend/vercel.json) | Vercel SPA client-side router rewrites |
| [`frontend/src/api/axios.js`](file:///C:/Users/muham/Videos/Java/BookNest/frontend/src/api/axios.js) | Dynamic API client supporting `VITE_API_URL` |
| [`.gitignore`](file:///C:/Users/muham/Videos/Java/BookNest/.gitignore) | Clean Git configuration ignoring `node_modules` and local cache |
