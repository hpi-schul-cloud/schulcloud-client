FROM node:16-alpine

ENV TZ=Europe/Berlin

RUN apk add \
    git \
    libtool \
    make \
    python3 \
    autoconf \
    automake \
    build-base \
    nasm \
    tzdata \
    zlib-dev

# use git https at all cost to avoid depdencies getting downloaded via ssh, which will fail
RUN git config --global url."https://github.com/".insteadOf git@github.com: \
    && git config --global url."https://".insteadOf git:// \
    && git config --global url."https://".insteadOf ssh://

ARG SC_THEME_BUILD=default
ENV SC_THEME=$SC_THEME_BUILD
EXPOSE 3100

WORKDIR /home/node/app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN node node_modules/gulp/bin/gulp.js clear-cache && node node_modules/gulp/bin/gulp.js

CMD npm start
