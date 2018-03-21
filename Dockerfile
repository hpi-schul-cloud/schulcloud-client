FROM node:8.7.0

RUN npm install -g nodemon gulp

# Copy current directory to container
COPY . /home/node/app

# Run npm install 
RUN cd /home/node/app && npm install 

VOLUME /home/node/app/build
VOLUME /home/node/app/node_modules

#USER node

WORKDIR /home/node/app

EXPOSE 3100

CMD ["sh", "-c", "gulp && node bin/www"]
