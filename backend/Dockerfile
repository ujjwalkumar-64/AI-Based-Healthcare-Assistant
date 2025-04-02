# Use an official Node.js runtime as a parent image
FROM node:18

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev","--host", "0.0.0.0", "--port", "5000" , "--restart"]

