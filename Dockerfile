# if node version is changed, also adapt .nvmrc file
FROM node:lts-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base git libtool make nasm pkgconfig python2 tzdata zlib-dev

EXPOSE 3100

WORKDIR /home/node/app

RUN echo `pwd`
COPY ./package.json .
COPY ./package-lock.json .
# fix for intergrations tests
RUN npm set unsafe-perm true && npm install -g gulp-cli && npm ci

COPY . .
#COPY ./localtime /etc/localtime

#ARG BUILD_THEME=default
ENV SC_THEME=$BUILD_THEME
ENV TZ=Europe/Berlin
RUN echo BUILD_THEME=$BUILD_THEME
RUN gulp clear-cache
RUN gulp

VOLUME /home/node/app/build
CMD npm start
