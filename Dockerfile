FROM node:8.7.0
RUN git clone https://github.com/tobiasschulz/fdupes
RUN cd fdupes
RUN make fdupes
RUN su root
RUN make install
RUN npm install -g nodemon gulp
RUN rm -r fdupes

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
# build n21 theme
ENV SC_THEME n21
RUN gulp

# reset ENV
ENV SC_THEME default
#replace duplicate files with symlinks

RUN fdupes build -r -L
VOLUME /home/node/app/builddocker 
CMD node bin/www
