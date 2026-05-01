# CodeSync

![CodeSync Hero](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2070)

CodeSync is a professional, real-time collaborative development environment designed for high-velocity teams. Built with a minimalist aesthetic and a focus on visual excellence, it provides a seamless "Google Docs" style experience for code, complete with integrated execution and project management.

## ✨ Key Features

*   **Real-time Collaboration**: Powered by CRDTs (Yjs) for conflict-free editing. See teammate cursors and edits in real-time with zero latency.
*   **Integrated Execution Engine**: Run your code directly within the browser. Supports multiple languages with instant output feedback.
*   **Premium Workspace UI**: A sleek, dark-themed interface built on the Zinc palette. Designed for focus and professional performance.
*   **Team Management**: Invite collaborators via secure OTP verification. Manage projects, folders, and access levels with ease.
*   **File Explorer**: A fully functional, nested file system with support for files and folders.
*   **In-Editor Chat**: Built-in communication tools to keep your team aligned without switching context.

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS (Minimalist Design System)
- **Editor**: Monaco Editor (VS Code core)
- **Sync**: Yjs (Shared Types)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js / Express
- **Real-time**: Socket.io
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT & OTP-based verification

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas)

### Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/codesync.git
    cd codesync
    ```

2.  **Server Setup**:
    ```bash
    cd server
    npm install
    # Create a .env file with:
    # PORT=5000
    # MONGO_URI=your_mongodb_uri
    # JWT_SECRET=your_secret
    # EMAIL_USER=your_email (for OTP)
    # EMAIL_PASS=your_pass
    npm run dev
    ```

3.  **Client Setup**:
    ```bash
    cd ../client
    npm install
    # Create a .env.local file with:
    # NEXT_PUBLIC_SERVER_URL=http://localhost:5000
    npm run dev
    ```

## 🎨 Design Philosophy

CodeSync follows a **Minimalist Professional** design philosophy. We prioritize:
- **Zinc Palette**: Reducing visual noise with deep grays and whites.
- **Typography**: Utilizing Inter for maximum readability.
- **Glassmorphism**: Subtle translucent layers for a sense of depth and premium quality.
- **Micro-animations**: Smooth transitions that make the app feel alive.

---

Built with ❤️ by the CodeSync Team.
