FROM docker.io/node:16 as git

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
COPY .git .
RUN echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/version

FROM docker.io/node:16-alpine

ENV TZ=Europe/Berlin

RUN apk add \
    git \
    libtool \
    make \
    python3 \
    autoconf \
    automake \
    build-base \
    nasm \
    tzdata \
    zlib-dev

# use git https at all cost to avoid depdencies getting downloaded via ssh, which will fail
RUN git config --global url."https://github.com/".insteadOf git@github.com: \
    && git config --global url."https://".insteadOf git:// \
    && git config --global url."https://".insteadOf ssh://

ARG SC_THEME_BUILD=default
ENV SC_THEME=$SC_THEME_BUILD
EXPOSE 3100

WORKDIR /home/node/app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
# thanks to this crappy folder structure pulling only the relevant files is a mess
COPY api.js /home/node/app/api.js
COPY api-files-storage.js /home/node/app/api-files-storage.js
COPY apiEditor.js /home/node/app/apiEditor.js
COPY app.js /home/node/app/app.js
COPY gulpfile.js /home/node/app/gulpfile.js
COPY webpack.config.js /home/node/app/webpack.config.js
COPY sc-config.json /home/node/app/sc-config.json
COPY views /home/node/app/views
COPY static /home/node/app/static
COPY theme /home/node/app/theme
COPY middleware /home/node/app/middleware
COPY locales /home/node/app/locales
COPY helpers /home/node/app/helpers
COPY controllers /home/node/app/controllers
COPY config /home/node/app/config
COPY bin /home/node/app/bin
COPY --from=git /app/version /home/node/app/static/version
# "build" .. this basically throws out non relevant files for the theme under build and does scss to css stuff
RUN node node_modules/gulp/bin/gulp.js clear-cache && node node_modules/gulp/bin/gulp.js

CMD npm start
