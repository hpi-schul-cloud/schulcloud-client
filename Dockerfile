# if node version is changed, also adapt .nvmrc file
FROM node:lts-alpine

EXPOSE 3100

WORKDIR /home/node/app

COPY . .

VOLUME /home/node/app/build
CMD npm start
