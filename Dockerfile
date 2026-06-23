FROM node:24-bookworm-slim AS builder

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends git  \
    libtool \
    make \
    python3 \
    autoconf \
    automake \
    build-essential \
    nasm \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure git to use https (to avoid SSH dependency issues)
RUN git config --global url."https://github.com/".insteadOf git@github.com: \
    && git config --global url."https://".insteadOf git:// \
    && git config --global url."https://".insteadOf ssh://

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy application source
COPY bin ./bin
COPY config ./config
COPY controllers ./controllers
COPY helpers ./helpers
COPY locales ./locales
COPY middleware ./middleware
COPY static ./static
COPY theme ./theme
COPY views ./views
COPY api-files-storage.js api.js app.js gulpfile.js sc-config.json webpack.config.js ./

# Get version info from git using build-time mount
RUN --mount=type=bind,source=.git,target=/app/.git \
    git config --global --add safe.directory /app && \
    echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/static/version

# Build assets for the specified theme
ARG SC_THEME_BUILD=default
ENV SC_THEME=$SC_THEME_BUILD

RUN export NODE_OPTIONS=--openssl-legacy-provider && \
    node node_modules/gulp/bin/gulp.js

# Remove devDependencies to keep the production image small
RUN npm prune --production

FROM gcr.io/distroless/nodejs24-debian13:nonroot AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NO_COLOR="true"
ENV SC_THEME=default

# Copy the cleaned /app directory from builder
COPY --from=builder /app ./

USER nonroot

EXPOSE 3100

CMD ["--unhandled-rejections=warn", "./bin/www"]
