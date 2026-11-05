# H.U.N.T — UNIT

> **Helper Unit for Network Tasks** — Bot Discord sur-mesure, modulaire, léger et 100 % gratuit.  
> 🌐 Présentation complète : **[venatictundra22.com/hunt-unit](https://venatictundra22.com/hunt-unit/)**

---

## 🧰 Technologies & Sécurité

| Élément | Détail |
|---|---|
| Runtime | Node.js 20 (`node:20-alpine`) |
| Librairie | `discord.js` v14.27 (support des **Components V2**) |
| Architecture | Modulaire : 1 fichier = 1 commande slash chargée et enregistrée automatiquement |
| Conteneurisation | Docker & Docker Compose (utilisateur non-root `node`, `no-new-privileges:true`, limites CPU/RAM) |

---

## 🤖 Commandes disponibles

| Commande | Description |
|---|---|
| `/help` | Affiche l'aide interactive sur les commandes du bot |
| `/embed` | Ouvre une interface interactive pour créer et prévisualiser un embed |
| `/builder` | Constructeur avancé multi-embeds avec message texte et prévisualisation |
| `/clear` | Supprime un nombre défini de messages dans un salon |
| `/reactionrole` | Crée ou modifie un panneau d'attribution de rôles interactif (Components V2) |
| `/say` | Envoie un message (texte et/ou image) via le bot |
| `/paslu` | Réagit à un message via son ID avec les émojis `P A S L U` |
| `/sauvegarder-serveur` | Exporte la configuration d'un serveur (rôles, salons, permissions…) en fichier `.json` |
| `/importer-serveur` | Restaure de manière sélective une sauvegarde `.json` générée par `/sauvegarder-serveur` |

---

## 🚀 Installation & Déploiement

### 1. Cloner et configurer

```bash
git clone https://github.com/VenaticTundra22/H.U.N.T---UNIT.git discord-bot
cd discord-bot
cp .env.example .env
nano .env   # renseigner DISCORD_TOKEN (et éventuellement GUILD_ID)
```

### 2. Lancer avec Docker Compose (recommandé)

```bash
docker compose up -d --build
docker compose logs -f
```

### Alternative : lancer en local avec Node.js (≥ 20)

```bash
npm install
node index.js
```

---

## 📁 Structure du Projet

```
discord-bot/
├── index.js                      ← Point d'entrée (chargement auto des commandes)
├── Dockerfile                    ← Image Node 20 Alpine (utilisateur non-root)
├── docker-compose.yml            ← Orchestration et limites de ressources
├── .env.example                  ← Modèle des variables d'environnement
├── utils/
│   └── embedHelper.js            ← Fonctions utilitaires (buildEmbed, validateColor…)
├── commands/                     ← 📂 Commandes slash (une par fichier)
│   ├── help.js                   ← /help
│   ├── embed.js                  ← /embed
│   ├── builder.js                ← /builder
│   ├── clear.js                  ← /clear
│   ├── reactionrole.js           ← /reactionrole (Components V2)
│   ├── say.js                    ← /say
│   ├── paslu.js                  ← /paslu
│   ├── sauvgarder serveur.js     ← /sauvegarder-serveur
│   └── importer serveur.js       ← /importer-serveur
├── templates/                    ← 📂 Modèles à copier pour créer une commande
│   ├── TEMPLATE_simple.js
│   ├── TEMPLATE_modal.js
│   └── TEMPLATE_buttons.js
├── LICENSE                       ← Licence MIT
└── README.md                     ← Documentation & guide technique
```

---

## 🌍 Mode DEV vs Mode PROD (Configuration `.env`)

Le comportement d'enregistrement des commandes dépend directement de votre fichier `.env` :

- **🛠️ MODE DEV** (si `GUILD_ID` est renseigné) :
  Le bot enregistre les commandes **uniquement** sur le serveur spécifié. L'enregistrement est **instantané**, ce qui est parfait pour développer et tester vos commandes sans attendre.

- **🌍 MODE PROD** (si `GUILD_ID` est vide ou commenté) :
  Le bot enregistre les commandes **globalement**. Elles seront disponibles sur tous les serveurs où le bot est invité. C'est ce mode qui permet d'obtenir le badge `APP`. *Note : Discord peut mettre quelques minutes pour actualiser les commandes globales.*

---

# 📚 Guide — Créer une Commande

## ⚡ Étapes rapides

```bash
# 1. Choisir un template selon vos besoins
cp templates/TEMPLATE_simple.js  commands/ma-commande.js   # Commande simple
cp templates/TEMPLATE_modal.js   commands/ma-commande.js   # Avec formulaire
cp templates/TEMPLATE_buttons.js commands/ma-commande.js   # Avec boutons

# 2. Éditer le fichier (voir ci-dessous)
# 3. Redémarrer le bot
docker compose restart   # ou : node index.js
# La commande est automatiquement chargée et enregistrée !
```

---

## 🔧 Anatomie d'une Commande

Chaque fichier dans `/commands` **doit** exporter exactement :

```js
module.exports = {
    definition,         // SlashCommandBuilder — décrit la commande
    handleInteraction,  // async function(interaction) — gère les interactions
};
```

### Squelette minimal

```js
const { SlashCommandBuilder } = require('discord.js');

const definition = new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Ce que fait ma commande');

async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ma-commande') return;

    await interaction.reply({ content: 'Bonjour !', ephemeral: true });
}

module.exports = { definition, handleInteraction };
```

---

## 📝 Templates prêts à l'emploi

Pour éviter de réinventer la roue ou d'avoir à mémoriser l'API de Discord, **3 templates complets et commentés** sont à votre disposition dans le dossier `/templates/` :

1. **`TEMPLATE_simple.js`** : Pour une commande classique (avec options de texte, nombre, etc.).
2. **`TEMPLATE_buttons.js`** : Pour une commande qui affiche des boutons cliquables.
3. **`TEMPLATE_modal.js`** : Pour une commande qui ouvre un formulaire (modal) pour saisir des données.

💡 **Astuce** : Le fichier `utils/embedHelper.js` contient toutes les fonctions prêtes à l'emploi pour générer vos messages Embeds (`buildEmbed()`, `extractEmbedFields()`, etc.). N'hésitez pas à l'ouvrir !

---

## 🧱 Discord Components V2

Depuis **discord.js 14.18+**, il est possible d'utiliser les **Components V2** pour créer des messages avec un layout avancé.
Les commandes `/reactionrole`, `/sauvegarder-serveur` et `/importer-serveur` utilisent ce système.

### Builders disponibles

| Builder | Rôle |
|---|---|
| `ContainerBuilder` | Conteneur principal (remplace l'embed, avec barre de couleur latérale) |
| `SectionBuilder` | Ligne avec texte à gauche et un bouton/image à droite |
| `TextDisplayBuilder` | Affichage de texte Markdown à l'intérieur d'un container |
| `SeparatorBuilder` | Ligne de séparation horizontale |

### Exemple : bouton aligné à droite d'un texte

```js
const {
    ContainerBuilder, SectionBuilder,
    TextDisplayBuilder, ButtonBuilder,
    ButtonStyle, MessageFlags
} = require('discord.js');

const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('Mon texte à gauche')
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('mon_bouton')
                    .setLabel('Bouton')
                    .setStyle(ButtonStyle.Secondary)
            )
    );

await interaction.reply({
    components: [container],
    flags: [MessageFlags.IsComponentsV2],
});
```

> **⚠️ Règles importantes des Components V2 :**
> - Les messages V2 sont **incompatibles** avec la propriété `embeds` traditionnelle.
> - Toute mise à jour (`update()`) d'un message V2 **doit** conserver le flag `MessageFlags.IsComponentsV2`, sinon Discord rejette la requête.
> - Requis : `discord.js ≥ 14.18` (ce projet utilise `14.27.0`).

---

## 📋 Checklist — Nouvelle Commande

Avant de tester, vérifier :

- [ ] Le fichier est dans `/commands/`
- [ ] `definition` est un `SlashCommandBuilder` avec `.setName()` et `.setDescription()`
- [ ] `handleInteraction` est une fonction `async`
- [ ] La fonction commence par un guard : `if (!interaction.isChatInputCommand() || interaction.commandName !== 'ma-commande') return;`
- [ ] Tous les `customId` (modaux, boutons) sont **uniques** dans tout le bot
- [ ] Convention de nommage respectée : `'nomcommande_nomelément'`
- [ ] `module.exports = { definition, handleInteraction }` présent
- [ ] Bot redémarré après modification

---

## 🚨 Erreurs Fréquentes

| Erreur | Cause | Solution |
|---|---|---|
| `Unknown interaction` | Trop lent à répondre (> 3 s) | Utiliser `interaction.deferReply()` avant toute opération longue |
| `Interaction already replied` | Double réponse | Vérifier qu'on ne `reply()` pas deux fois |
| `Missing Permissions` | Bot sans droit dans le salon | Vérifier les permissions du bot dans le salon |
| Commande non visible | Mauvais export ou pas de redémarrage | Vérifier `module.exports` et relancer le bot |
| Bouton qui ne répond pas | `customId` mal orthographié | Vérifier que le `customId` du builder = celui du handler |
| `Invalid Form Body` sur `update()` V2 | Flag `IsComponentsV2` absent lors de la mise à jour | Toujours inclure `flags: [MessageFlags.IsComponentsV2]` dans chaque `update()` ou `reply()` sur un message V2 |

---

## 📖 Ressources

- [Discord.js Guide](https://discordjs.guide/) — Guide officiel
- [Discord.js Docs](https://discord.js.org/) — Documentation de l'API
- [Discord Developer Portal](https://discord.com/developers/docs/intro) — Documentation Discord
- [Discord Components V2 — API Docs](https://discord.com/developers/docs/components/reference) — Référence officielle des Components V2
- [Discohook](https://discohook.org/) — Aperçu visuel d'embeds

---

## 📜 Licence

Projet distribué sous licence [MIT](LICENSE).
