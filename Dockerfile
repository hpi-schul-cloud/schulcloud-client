# if node version is changed, also adapt .nvmrc file
ARG SC_THEME_BUILD=default
FROM node:lts-alpine

EXPOSE 3100

WORKDIR /home/node/app

COPY . .

ENV SC_THEME=$SC_THEME_BUILD
ENV TZ=Europe/Berlin
CMD npm start