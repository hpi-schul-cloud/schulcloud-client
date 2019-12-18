# if node version is changed, also adapt .nvmrc file
FROM node:10.16-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base git libtool make nasm pkgconfig python2 tzdata zlib-dev

EXPOSE 3100

WORKDIR /home/node/app

COPY ./package.json .
COPY ./package-lock.json .
RUN chown -R 1000:1000 /home/node/app && npm config set user 1000 && npm set group 1000 && npm install -g gulp-cli && npm ci

COPY . .
#COPY ./localtime /etc/localtime

ENV SC_THEME=default
ENV TZ=Europe/Berlin
RUN gulp && rm .gulp-changed-smart.json

VOLUME /home/node/app/build
CMD npm start

