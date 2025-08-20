FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 4000

# Run database migrations and seed on container startup.  Use a shell to chain commands.
# Attempt to run migrations; fall back to pushing the schema if no migrations exist.
# Always seed the database before starting the server.
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push; npx prisma db seed; node dist/app.js"]