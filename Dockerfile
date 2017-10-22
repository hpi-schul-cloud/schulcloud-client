FROM node:8.7.0

RUN npm install -g nodemon gulp

# Copy current directory to container
COPY . /home/node/app

# Run npm install && gulp
RUN cd /home/node/app && npm install && gulp

USER node
WORKDIR /home/node/app

EXPOSE 3100
CMD ["node", "bin/www"]