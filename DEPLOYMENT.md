# 🚀 Deployment Guide: CodeSync

This guide will walk you through deploying your full-stack collaborative editor using modern cloud platforms.

## 🌉 The Architecture
- **Frontend (Next.js)**: Deployed to [Vercel](https://vercel.com).
- **Backend (Node.js + Socket.io)**: Deployed to [Render](https://render.com), [Railway](https://railway.app), or [DigitalOcean App Platform](https://www.digitalocean.com).
- **Database (MongoDB)**: Managed via [MongoDB Atlas](https://www.mongodb.com/atlas).

> [!IMPORTANT]
> **Why separate services?** Vercel's serverless functions do not support long-lived WebSocket connections (Socket.io). Therefore, the backend must be hosted on a service that provides persistent server instances (PaaS).

---

## 1. Prepare Environment Variables

### 🖥️ Frontend (Vercel)
In the Vercel Dashboard, add the following under **Project Settings > Environment Variables**:
- `NEXT_PUBLIC_SERVER_URL`: Your deployed backend URL (e.g., `https://codesync-server.onrender.com`).
- `NEXT_PUBLIC_CLIENT_URL`: Your Vercel domain (e.g., `https://codesync.vercel.app`).

### ⚙️ Backend (Render/Railway)
In your backend service settings, add:
- `MONGODB_URI`: Your MongoDB connection string.
- `CLIENT_URL`: Your deployed frontend URL (for CORS security).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: For email verification codes.
- `PORT`: Usually automatically set by the provider, but ensure your code uses `process.env.PORT`.

---

## 2. Step-by-Step Deployment

### Step A: Deploy the Backend (Socket.io)
Services like **Render** are highly recommended:
1.  Connect your GitHub repo.
2.  Choose **Web Service**.
3.  Set **Root Directory** to `server`.
4.  Set **Build Command** to `npm install`.
5.  Set **Start Command** to `node index.js`.
6.  Once deployed, copy the **URL** (it will end in `.onrender.com`).

### Step B: Deploy the Frontend (Vercel)
1.  Import your GitHub repo into Vercel.
2.  In the "Edit Import" screen, change **Root Directory** to `client`.
3.  Vercel will automatically detect the **Next.js** framework.
4.  Add the `NEXT_PUBLIC_SERVER_URL` variable with the URL from **Step A**.
5.  Deploy!

---

## 🔒 Security Best Practices
- **Strict CORS**: Now that you have a static frontend URL, update the `CLIENT_URL` env variable on your backend server to block requests from other domains.
- **Email Service**: Ensure your SMTP credentials are secure. Do NOT commit them to Git.
- **Database IP Whitelist**: If using MongoDB Atlas, remember to add `0.0.0.0/0` (not recommended for production) or whitelist the IP ranges of your hosting providers.

---

## 🔍 Troubleshooting Deployment
- **Socket connection fails?** Check if you're using `http` instead of `https` for the `SERVER_URL`.
- **403 Forbidden?** Double-check the `CLIENT_URL` in the backend CORS settings matches your Vercel URL exactly (no trailing slash).
- **MongoDB connection time-out?** Verify your `MONGODB_URI` password doesn't contain unencoded special characters.
