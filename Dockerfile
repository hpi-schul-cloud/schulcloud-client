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

RUN gulp
RUN rm .gulp-changed-smart.json
#build n21 theme
ENV SC_THEME n21
RUN gulp

#reset ENV
ENV SC_THEME default

CMD node bin/www
