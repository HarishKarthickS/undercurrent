FROM node:22-alpine AS development
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
FROM development AS runtime
ENV NODE_ENV=production
RUN npm prune --omit=dev
EXPOSE 3001
CMD ["npm", "run", "start"]
