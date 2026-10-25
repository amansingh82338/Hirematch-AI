FROM node:22-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies required for build & tsx)
RUN npm install

# Copy application source
COPY . .

# Build the Vite React frontend into /app/dist
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start Express server with tsx
CMD ["npm", "run", "start"]
