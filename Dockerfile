FROM node:24-alpine

# Create app directory
WORKDIR /opt/stackstorm/static/webui/st2web

# git stamps the commit into package.meta
RUN apk add --no-cache git

# install dependencies first so they cache separately from the source
# .npmrc carries the supply-chain settings (no install scripts, registry-only)
COPY package.json package-lock.json .npmrc ./
COPY apps ./apps
COPY modules ./modules
RUN npm ci --no-audit --no-fund

# get files and build
COPY . .
RUN npm run build

# expose your ports
EXPOSE 3000

# serve the production build
CMD [ "npm", "run", "serve" ]
