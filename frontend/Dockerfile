# Use Node.js as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build project
RUN npm run build

# Expose port
EXPOSE 5185

# Start development server
CMD ["npm", "run", "dev", "--", "--host"] 