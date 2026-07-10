FROM node:20-alpine
WORKDIR /usr/src/app

# Copy root configs and package lists
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies (workspaces auto link)
RUN npm ci

# Copy shared & backend modules
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build modules
RUN npm run build -w shared
RUN npm run build -w backend

EXPOSE 5000
CMD ["npm", "start", "-w", "backend"]
