FROM node:10.15.3

# Create app directory
WORKDIR /opt/stackstorm/static/webui/st2web

# get files
COPY . /opt/stackstorm/static/webui/st2web
RUN rm /opt/stackstorm/static/webui/st2web/yarn.lock

# install dependencies
RUN npm install -g gulp-cli lerna yarn
RUN lerna bootstrap

# expose your ports
EXPOSE 3000

# start it up
CMD [ "gulp" ]
