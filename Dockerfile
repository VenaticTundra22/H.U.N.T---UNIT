FROM node:20-alpine

# Définir l'environnement de production (sécurité et performances)
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copier les fichiers en donnant la propriété à l'utilisateur restreint 'node'
COPY --chown=node:node package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Copier le reste du code
COPY --chown=node:node . .

# BASCULER SUR L'UTILISATEUR SÉCURISÉ (Empêche d'être 'root' dans le conteneur)
USER node

CMD ["node", "--max-old-space-size=256", "index.js"]
