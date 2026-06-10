FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]




# Se va a poder usar este dockerfile cuando el proyecto quede debuggeado al 100%

#FROM node:20-alpine

#WORKDIR /app

#COPY package*.json ./

#RUN npm install

#COPY . .

#RUN npm run build

#EXPOSE 3000

#CMD ["npm", "run", "start"]
