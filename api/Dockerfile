# `--omit=optional` : `keycloak-connect` déclare `chromedriver: "latest"` en
# dépendance optionnelle. Rien ici ne pilote de navigateur — c'est un reliquat
# de sa propre suite de tests Selenium — mais npm l'installait, avec son script
# `install` qui télécharge un binaire de navigateur, et toute sa dépendance
# transitive : axios, basic-ftp, extract-zip, form-data, follow-redirects.
# À elle seule, cette branche portait 35 des 50 alertes de sécurité du dépôt,
# dont l'unique critique et le seul paquet sans correctif publié.
FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=optional
COPY . .
RUN npm run build

FROM node:26-alpine AS production
RUN apk add --no-cache whois
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
