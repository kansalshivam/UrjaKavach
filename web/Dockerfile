FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY index.html ./
COPY src ./src
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.js ./

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
