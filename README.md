# 💬 SecureJoin — Real-Time Chat Application

SecureJoin is a lightweight, real-time chat application built with **Node.js**, **Express**, and **Socket.IO**. It enables multiple users to join chat rooms and exchange messages instantly — perfect for group communication and real-time collaboration.

---

## 🚀 Features

- 🔌 Real-time messaging with Socket.IO
- 🧑‍🤝‍🧑 Multiple users in a chatroom
- 📡 Auto broadcast messages to all users
- 💻 Simple and responsive frontend with HTML/CSS/JS
- 🌐 Deployed on [Render](https://render.com) for public access

---

## 🛠️ Tech Stack

| Layer       | Technology           |
|-------------|----------------------|
| Backend     | Node.js, Express.js  |
| Real-time   | Socket.IO            |
| Frontend    | HTML, CSS, Vanilla JS |
| Deployment  | Render               |

---

## 📂 Project Structure
```
SecureJoin/
├── public/                  # Frontend files (served statically)
│   ├── index.html           # Main HTML page
│   ├── style.css            # Styling for the chat UI
│   └── script.js            # Client-side JS (Socket.IO, DOM handling)
│
├── server.js                # Entry point for the backend (Express + Socket.IO server)
│
├── package.json             # Project metadata and dependencies
├── package-lock.json        # Dependency lock file
├── .gitignore               # Git ignore rules (node_modules, .env, etc.)
└── README.md                # Project overview and documentation
```

---

## 📦 Installation & Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com//SecureJoin.git
   cd SecureJoin
   ```

  **Install dependencies**
  ```
npm install
```
  **Start the server**
```
node server.js
```
**Open in browser Visit http://localhost:3000 or your configured port**

## 🌍 Live Demo
Access the live deployed version here:
👉[live Link]( https://securejoin.onrender.com)

## 🙌 Acknowledgements
Node.js
Express
Socket.IO
Render
