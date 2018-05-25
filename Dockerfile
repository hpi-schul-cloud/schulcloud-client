FROM node:8.7.0

RUN git clone https://github.com/tobiasschulz/fdupes
RUN cd fdupes && make fdupes && make install
RUN cd ..
RUN rm -r fdupes

#gulp
RUN npm install -g nodemon gulp-cli	

# Copy current directory to container
COPY . /home/node/app

# Run npm install 
RUN cd /home/node/app && npm install 

VOLUME /home/node/app/node_modules

# USER node

WORKDIR /home/node/app

EXPOSE 3100

RUN gulp
RUN rm .gulp-changed-smart.json
RUN cp -R build/default build/n21
# build n21 theme
ENV SC_THEME n21
RUN gulp build-theme-files

# reset ENV
ENV SC_THEME default
#replace duplicate files with symlinks

RUN fdupes build -r -L
VOLUME /home/node/app/build
CMD node bin/www
