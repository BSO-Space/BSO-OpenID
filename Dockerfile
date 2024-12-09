# Stage 1: Build the application
FROM node:22 AS build

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

# Generate a key for the JWT secret
RUN npm run generate:key

# Stage 2: Production image
FROM node:22 AS production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/keys /app/keys
COPY --from=build /app/public /app/public

# Run the application
CMD ["node", "dist/src/server.js"]
