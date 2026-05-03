FROM node:22-alpine

WORKDIR /app

# Copy root config files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy workspaces package.json
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm ci

# Copy client source code
COPY client/ ./client/

# Build the Next.js app
WORKDIR /app/client
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]
