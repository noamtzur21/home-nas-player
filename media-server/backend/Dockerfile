FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates curl unzip \
  && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
  && pip3 install --break-system-packages -U yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/local/bin:${PATH}"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p /app/cache

ENV NODE_ENV=production
ENV CACHE_DIR=/app/cache

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD sh -c 'curl -fsS "http://127.0.0.1:${PORT:-10000}/health" || exit 1'

CMD ["npm", "start"]
