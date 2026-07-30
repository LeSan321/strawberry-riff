FROM node:22-slim

# Install ffmpeg (required by the Mixer's vocal overlay feature)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all source (patches/ must be present before pnpm install)
COPY . .

# Install dependencies and build (frontend + server)
RUN npm install -g corepack@latest && corepack pnpm install && corepack pnpm run build

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
