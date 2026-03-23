# 🛸 Premium MD — WhatsApp AI Bot

A world-class, feature-rich WhatsApp bot with a stunning Cyberpunk dashboard and advanced AI capabilities.

## ✨ Premium Features
- **Modern Dashboard**: Sleek glassmorphic admin panel with real-time monitoring.
- **Auto-Bio Flux**: Automated profile status updates with system health.
- **Elegant UI**: Sophisticated unicode message formatting.
- **AI Integration**: Powered by advanced language models for chat and image gen.

## Prerequisites
- Node.js (v16 or higher)
- ffmpeg (for media processing)

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/Bot-Fixer.git
    cd Bot-Fixer
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # OR
    pnpm install
    ```

3.  **Configure environment variables**:
    Copy `.env.example` to `.env` and fill in your details.
    ```bash
    cp .env.example .env
    ```

4.  **Start the bot**:
    ```bash
    npm start
    ```

## Configuration
Edit `config.js` or use environment variables:
- `OWNER_NUMBER`: Your WhatsApp number (e.g., 94742514900)
- `PREFIX`: Command prefix (default: `.`)
- `BOT_NAME`: Name of your bot

## Dashboard
The bot includes a web dashboard accessible at `http://localhost:5000` (or your configured port).
- Default Admin: `admin`
- Default Password: `changeme123`

## License
MIT
