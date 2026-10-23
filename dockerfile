FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

# Solo si hace falta debuggear el proyecto, se puede usar este dockerfile para levantar el proyecto en modo desarrollo

# FROM node:20-alpine

#WORKDIR /app

#COPY package*.json ./

#RUN npm install

#COPY . .

#EXPOSE 3000

#CMD ["npm", "run", "dev"]
