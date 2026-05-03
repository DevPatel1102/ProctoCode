FROM node:22-alpine

# Install Python3 for the sandbox execution
RUN apk add --no-cache python3

WORKDIR /app

# Copy root config files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy workspaces package.json to install dependencies correctly
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies using npm ci for deterministic builds
RUN npm ci

# Copy server source code
COPY server/ ./server/

# Build the server
WORKDIR /app/server
RUN npm run build

# Expose the port the server runs on
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
