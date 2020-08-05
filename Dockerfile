FROM node:10.15.3

# Create app directory
WORKDIR /opt/stackstorm/static/webui/st2web

# get files
COPY . /opt/stackstorm/static/webui/st2web
RUN rm /opt/stackstorm/static/webui/st2web/yarn.lock

# install dependencies
RUN make build-and-install

# expose your ports
EXPOSE 3000

# start it up
CMD [ "gulp serve-production" ]
