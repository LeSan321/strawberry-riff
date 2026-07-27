FROM node:22-slim

# Install ffmpeg system binary (required by server/mixer/mixer.ts for vocal stem mixing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Tell the mixer module to use the system ffmpeg binary
ENV FFMPEG_BIN=/usr/bin/ffmpeg

WORKDIR /app
COPY . .
RUN npm install -g corepack@latest && corepack pnpm install && corepack pnpm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
