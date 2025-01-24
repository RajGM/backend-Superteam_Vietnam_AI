# Use an official Node.js image as the base
FROM node:23-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application's source code
COPY . .

# Expose both ports (3000 for Express, 3003 for Slack)
EXPOSE 3000 3003

# Define the command to run your app using npm
CMD ["npm", "start"]
