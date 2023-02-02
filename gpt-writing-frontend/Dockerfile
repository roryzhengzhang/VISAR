FROM node:18-alpine

WORKDIR /app/frontend-server

ENV PATH /app/frontend-server/node_modules/.bin:$PATH

COPY . .

# === Build the frontend ===
# Install dependencies
RUN npm ci --legacy-peer-deps
RUN npm install react-scripts

# # Build the app
# RUN npm run build

# # === Run ===
# ENV NODE_ENV=production

# Expose port on which the server will on
EXPOSE 3000
CMD ["npm", "run", "start"]