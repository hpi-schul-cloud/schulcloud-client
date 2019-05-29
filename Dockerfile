# if node version is changed, also adapt .nvmrc file
FROM node:8.15-alpine

RUN apk update && apk upgrade && apk add --no-cache autoconf automake build-base git libtool make nasm pkgconfig tzdata zlib-dev

EXPOSE 3100

WORKDIR /home/node/app

COPY ./package.json .
RUN npm install -g nodemon gulp-cli && npm install

COPY . .
#COPY ./localtime /etc/localtime

ENV SC_THEME=default
ENV TZ=Europe/Berlin
RUN gulp && rm .gulp-changed-smart.json

VOLUME /home/node/app/build
CMD npm start

