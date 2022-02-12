FROM node:17.0.1

WORKDIR /users-api/

COPY . .

RUN npm install
RUN npx prisma generate

COPY prisma prisma

CMD ["npm", "run", "build-start"]

EXPOSE 3000