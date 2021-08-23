FROM node:lts-alpine

ENV TZ=Europe/Berlin

RUN apk add \
    git \
    libtool \
    make \
    python2 \
    autoconf \
    automake \
    build-base \
    nasm \
    tzdata \
    zlib-dev

ARG SC_THEME_BUILD=default
ENV SC_THEME=$SC_THEME_BUILD
EXPOSE 3100

WORKDIR /home/node/app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN node node_modules/gulp/bin/gulp.js clear-cache && node node_modules/gulp/bin/gulp.js

CMD npm start
