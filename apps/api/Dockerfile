# Start from the latest Node.js image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy source code and configuration files
COPY . .

# Install dependencies
RUN npm install

# Compile TypeScript code
RUN npm run build

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Run the compiled application
CMD ["node", "dist/server.js"]
