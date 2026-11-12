FROM node:22-bookworm

EXPOSE 5173

WORKDIR /opt/node_app

COPY package.json package-lock.json ./
RUN npm ci --include=dev
ENV PATH=/opt/node_app/node_modules/.bin:$PATH

WORKDIR /opt/node_app/app
COPY . .

CMD ["npm", "run", "docs:dev"]
