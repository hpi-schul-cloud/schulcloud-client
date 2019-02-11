FROM node:8.15 as builder

RUN git clone https://github.com/tobiasschulz/fdupes
RUN cd fdupes && make fdupes && make install
RUN cd ..
RUN rm -r fdupes

WORKDIR /home/node/app

# Copy current directory to container
COPY ./package.json .

# Install Gulp
RUN npm install -g nodemon gulp-cli

# Run npm install 
RUN npm install 

COPY . .

EXPOSE 3100

# Build default theme
RUN gulp && rm .gulp-changed-smart.json

# Build n21 theme
RUN cp -R build/default build/n21
#RUN ln -sf build/default build/n21
ENV SC_THEME n21
RUN gulp build-theme-files

# Reset ENV
ENV SC_THEME default

# Replace duplicate files with symlinks
RUN fdupes -r -L ./build

VOLUME /home/node/app/build
CMD node bin/www



#FROM node:8.15-alpine
#RUN apk update && apk upgrade && apk add --no-cache git

#EXPOSE 3100

#WORKDIR /home/node/app

#COPY ./package.json .
#RUN npm install 
#--only=production

#COPY --from=builder /home/node/app/LICENSE /home/node/app/api.js /home/node/app/app.js /home/node/app/bin /home/node/app/build /home/node/app/controllers /home/node/app/data /home/node/app/diff.sh /home/node/app/frontend_test.sh /home/node/app/gulpfile.js /home/node/app/helpers /home/node/app/nightwatch.conf.js /home/node/app/package-lock.json /home/node/app/package.json /home/node/app/static /home/node/app/test /home/node/app/theme /home/node/app/views /home/node/app/webpack.config.js /home/node/app/yarn.lock ./

#VOLUME /home/node/app/build
#CMD node bin/www

