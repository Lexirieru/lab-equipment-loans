FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["npm", "start"]
