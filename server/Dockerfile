FROM node:20-bookworm-slim

WORKDIR /app

# The system-migration feature creates/restores consistent MariaDB dumps.
RUN apt-get update \
  && apt-get install -y --no-install-recommends mariadb-client tar \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
