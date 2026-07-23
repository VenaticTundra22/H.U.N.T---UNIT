# 📚 Guide — Créer une Commande pour H.U.N.T - UNIT

> Guide complet pour créer, tester et déployer de nouvelles commandes slash Discord.

---

## 📁 Structure du Projet

```
discord-bot/
├── index.js              ← Point d'entrée (NE PAS MODIFIER sauf cas extrême)
├── utils/
│   └── embedHelper.js    ← Fonctions utilitaires (buildEmbed, validateColor…)
├── commands/             ← 📂 Vos commandes (une par fichier)
│   ├── embed.js           ← /embed
│   ├── builder.js         ← /builder
│   ├── clear.js           ← /clear (NEW)
│   ├── help.js            ← /help (NEW)
│   └── reactionrole.js    ← /reactionrole (Components V2) (NEW)
├── templates/            ← 📂 Templates à copier pour créer une commande
│   ├── TEMPLATE_simple.js
│   ├── TEMPLATE_modal.js
│   └── TEMPLATE_buttons.js
└── GUIDE_COMMANDES.md    ← Ce fichier
```

---

## 🌍 Mode DEV vs Mode PROD (Configuration .env)

Le comportement d'enregistrement des commandes dépend directement de votre fichier `.env` :

- **🛠️ MODE DEV** (Si `GUILD_ID` est renseigné) :
  Le bot enregistre les commandes **uniquement** sur le serveur spécifié. L'enregistrement est **instantané**, ce qui est parfait pour développer et tester vos commandes sans attendre.

- **🌍 MODE PROD** (Si `GUILD_ID` est vide ou commenté) :
  Le bot enregistre les commandes **globalement**. Elles seront disponibles sur tous les serveurs où le bot est invité. C'est ce mode qui permet d'obtenir le badge "APP". *Note : Discord peut mettre quelques minutes pour actualiser les commandes globales.*

---
## ⚡ Créer une nouvelle commande — Étapes rapides

```bash
# 1. Choisir un template selon vos besoins
cp templates/TEMPLATE_simple.js  commands/ma-commande.js   # Commande simple
cp templates/TEMPLATE_modal.js   commands/ma-commande.js   # Avec formulaire
cp templates/TEMPLATE_buttons.js commands/ma-commande.js   # Avec boutons

# 2. Éditer le fichier (voir ci-dessous)
# 3. Redémarrer le bot
node index.js
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

1. **`TEMPLATE_simple.js`** : Pour une commande classique (avec options de texte, nombre, etc).
2. **`TEMPLATE_buttons.js`** : Pour une commande qui affiche des boutons cliquables.
3. **`TEMPLATE_modal.js`** : Pour une commande qui ouvre un formulaire (modal) pour saisir des données.

💡 **Astuce** : Le fichier `utils/embedHelper.js` contient toutes les fonctions prêtes à l'emploi pour générer vos messages Embeds (`buildEmbed()`, `extractEmbedFields()`, etc.). N'hésitez pas à l'ouvrir !

---

## 🧱 Discord Components V2

Depuis **discord.js 14.18+**, il est possible d'utiliser les **Components V2** pour créer des messages avec un layout avancé.
La commande `/reactionrole` utilise ce système.

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

> **⚠ﺀ Règles importantes des Components V2 :**
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
|--------|-------|----------|
| `Unknown interaction` | Trop lent à répondre (>3s) | Utiliser `interaction.deferReply()` avant toute opération longue |
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
