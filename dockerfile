FROM node:20.14.0-alpine3.20
LABEL maintainer "ack@baibay.id"

ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
EXPOSE 3000

COPY package.json yarn.lock ./
RUN touch .env

RUN mkdir data
RUN set -x && yarn

COPY . .

CMD [ "yarn", "start:dev" ]
