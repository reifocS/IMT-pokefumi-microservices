FROM node:17.0.1

WORKDIR /match/src/

COPY . .

RUN npm install
RUN npx prisma db push
RUN npx prisma generate

COPY prisma prisma


CMD ["npm", "start"]

EXPOSE 8081