# if node version is changed, also adapt .nvmrc file
ARG SC_THEME_BUILD=default
FROM node:lts-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base git libtool make nasm pkgconfig python2 tzdata zlib-dev

EXPOSE 3100

WORKDIR /home/node/app

COPY ./package.json .
COPY ./package-lock.json .
RUN npm set unsafe-perm true && npm install -g nodemon gulp-cli && npm ci

COPY . .
#COPY ./localtime /etc/localtime

ENV SC_THEME=$SC_THEME_BUILD
ENV TZ=Europe/Berlin

RUN gulp clear-cache
RUN gulp

VOLUME /home/node/app/build
CMD npm start