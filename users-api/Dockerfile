FROM node:17.0.1

WORKDIR /usr/src/

COPY . .

RUN npm install
RUN npx prisma generate

COPY prisma prisma


CMD ["npm", "start"]

EXPOSE 3000
