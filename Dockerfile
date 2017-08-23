FROM node:7

WORKDIR /schulcloud-client
COPY . .
RUN npm rebuild node-sass --force && \
npm install && \
npm i -g gulp && \
gulp

CMD npm start
