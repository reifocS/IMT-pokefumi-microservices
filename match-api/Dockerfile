FROM node:17.0.1

WORKDIR /match-api/

COPY . .

RUN npm install
RUN npx prisma db push
RUN npx prisma generate

COPY prisma prisma

CMD ["npm", "run", "build-start"]

EXPOSE 3100