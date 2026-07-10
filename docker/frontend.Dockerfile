FROM node:20-alpine
WORKDIR /usr/src/app

# Copy root configs and package lists
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install dependencies (workspaces auto link)
RUN npm ci

# Copy shared & frontend modules
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build modules
RUN npm run build -w shared
RUN npm run build -w frontend

EXPOSE 3000
CMD ["npm", "start", "-w", "frontend"]
