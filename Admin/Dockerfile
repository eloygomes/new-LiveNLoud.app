FROM python:3.11-slim AS admin-api
WORKDIR /app
COPY admin_api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY admin_api ./admin_api
ENV PYTHONUNBUFFERED=1
EXPOSE 5185
CMD ["uvicorn", "admin_api.main:app", "--host", "0.0.0.0", "--port", "5185"]

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:admin

FROM node:20-alpine AS admin-web
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 5175
CMD ["node", "server/index.js"]
