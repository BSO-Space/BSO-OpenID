# Stage 1: Build the application
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files, including .pem files and TypeScript files
COPY . .

# Generate Prisma client for the correct binary targets
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Stage 2: Production image
FROM node:16 AS production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/*.pem /app/

# Expose the app port
EXPOSE 3000

# Run the application
CMD ["node", "dist/src/server.js"]
