FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=optional --ignore-scripts

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "run", "start"]
