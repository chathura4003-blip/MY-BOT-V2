# 🤖 CHATHU MD - WhatsApp Bot V2

A powerful, futuristic WhatsApp Bot with a sleek React-based Admin Panel and a robust API Server. Optimized for performance and stability.

![Banner](https://github.com/Chathura369/MY-BOT-V2/raw/master/artifacts/admin-panel/public/images/cyber-bg.png)

## 🚀 Key Features

*   **Modern Web Dashboard**: Real-time monitoring and control via a React + Vite + Tailwind CSS admin panel.
*   **Secure API Architecture**: Proxied communication between the frontend and the bot core via a TypeScript API server.
*   **Persistent Auth**: Robust session management using Baileys multi-file auth.
*   **Railway-Ready**: Pre-configured with Nixpacks and `railway.json` for one-click deployments.
*   **Developer Friendly**: Full TypeScript support, monorepo structure (pnpm), and automated type checking.

## 📦 Project Structure

```text
├── artifacts/
│   ├── admin-panel/     # Frontend (React + Vite)
│   ├── api-server/      # API Layer (Express + TS)
│   └── whatsapp-bot/    # Core Bot (Node.js)
├── lib/                 # Shared Workspace Libraries
└── railway.json         # Deployment Config
```

## 🛠️ Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)

### 2. Installation
```powershell
pnpm install
```

### 3. Running the Unified Bot
Everything (Frontend + API) runs on a single port for simplicity.
```powershell
pnpm build
pnpm run dev
```

Visit the unified dashboard at:
- **Unified UI + API**: [http://localhost:5000](http://localhost:5000)

*(Note: Bot core runs internally on port 9091)*

## ☁️ Deployment (Railway)

We've already configured the project for Railway. To deploy:

1. Connect your repository to Railway.
2. Set the following **Variables**:
   - `PORT`: (Managed by Railway)
   - `BOT_INTERNAL_PORT`: `9091`
   - `ADMIN_USER` / `ADMIN_PASS`: (Set your logins)
   - `SESSION_SECRET`: (Secure random string)
3. **Mount a Volume** to `/app/artifacts/whatsapp-bot/session` to persist your WhatsApp login.

## ⚙️ Configuration (Env Vars)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | 5000 | API Server listening port |
| `BOT_INTERNAL_PORT` | 9091 | Internal port for bot-proxy communication |
| `ADMIN_USER` | admin | Dashboard login username |
| `ADMIN_PASS` | admin123 | Dashboard login password |
| `SESSION_SECRET` | ... | JWT signing secret |

## 📜 License
MIT © Chathura369

---

### Developed with ❤️ for the community.
