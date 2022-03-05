FROM node:17.0.1

WORKDIR /users-api/

COPY . .

RUN npm install
RUN npx prisma db push
RUN npx prisma generate

CMD ["npm", "run", "build-start"]

EXPOSE 3000