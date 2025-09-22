# Stage 1: build Vue app
FROM node:20 AS client-build

WORKDIR /app
COPY client ./client
WORKDIR /app/client
RUN npm install && npm run build

# Stage 2: server
FROM node:20

WORKDIR /app

# Copy server code
COPY server.js package*.json ./

# Install only server deps
RUN npm install --production

# Copy built Vue dist from stage 1
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "run", "serve"]
