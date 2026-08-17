# Use official Node.js image
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Command to run the node server
CMD ["node", "server/server.js"]
