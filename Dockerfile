# Use Node.js 20 as base for better dependency support
FROM node:20

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ffmpeg \
    python3 \
    git \
    curl \
    ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-download yt-dlp for Linux (Application Root)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /app/yt-dlp \
    && chmod a+rx /app/yt-dlp

COPY package.json package-lock.json* ./

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update && apt-get install -y build-essential

RUN npm install --legacy-peer-deps --unsafe-perm=true
# Copy the rest of the application
COPY . .

# Ensure session directory exists for persistence
RUN mkdir -p /app/session 

# Expose the dashboard port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the bot using the optimized memory heap
CMD ["npm", "start"]
