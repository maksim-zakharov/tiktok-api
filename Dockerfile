FROM node:alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

#RUN apk add --no-cache chromium
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
#ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN npm install

COPY . .

# Сбилдим бек
RUN npm run build

FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

EXPOSE $PORT


CMD ["node", "dist/main"]
