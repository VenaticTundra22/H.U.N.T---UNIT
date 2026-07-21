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
│   ├── embed.js
│   └── builder.js
├── templates/            ← 📂 Templates à copier pour créer une commande
│   ├── TEMPLATE_simple.js
│   ├── TEMPLATE_modal.js
│   └── TEMPLATE_buttons.js
└── GUIDE_COMMANDES.md    ← Ce fichier
```

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

## 🎨 Options de SlashCommandBuilder

```js
new SlashCommandBuilder()
    .setName('commande')                  // Obligatoire — minuscules, tirets autorisés
    .setDescription('Description courte') // Obligatoire — max 100 caractères
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Admins seulement

    // ─── Types d'options ─────────────────────────────────────────
    .addStringOption(opt => opt
        .setName('texte').setDescription('Un texte').setRequired(true)
        .setMaxLength(100)
        .addChoices({ name: 'Option A', value: 'a' }) // Choix prédéfinis (optionnel)
    )
    .addIntegerOption(opt => opt
        .setName('nombre').setDescription('Un entier').setMinValue(1).setMaxValue(999)
    )
    .addNumberOption(opt => opt
        .setName('decimal').setDescription('Un nombre décimal')
    )
    .addBooleanOption(opt => opt
        .setName('actif').setDescription('Vrai ou Faux')
    )
    .addUserOption(opt => opt
        .setName('utilisateur').setDescription('Un membre du serveur')
    )
    .addChannelOption(opt => opt
        .setName('salon').setDescription('Un salon')
    )
    .addRoleOption(opt => opt
        .setName('role').setDescription('Un rôle')
    )
    .addAttachmentOption(opt => opt
        .setName('fichier').setDescription('Un fichier uploadé')
    )
;
```

### Lire les options dans le handler

```js
const texte       = interaction.options.getString('texte');
const nombre      = interaction.options.getInteger('nombre') ?? 10; // Valeur par défaut
const utilisateur = interaction.options.getUser('utilisateur') ?? interaction.user;
const salon       = interaction.options.getChannel('salon') ?? interaction.channel;
```

---

## 🪟 Modaux (Formulaires)

```js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

// Création du modal
const modal = new ModalBuilder()
    .setCustomId('mon-modal')          // ID unique dans tout le bot
    .setTitle('Titre du formulaire');  // Affiché à l'utilisateur

// Champ texte court
const champCourt = new TextInputBuilder()
    .setCustomId('champ1')
    .setLabel('Nom du champ')
    .setStyle(TextInputStyle.Short)    // Une ligne
    .setRequired(true)
    .setMaxLength(256);

// Champ texte long
const champLong = new TextInputBuilder()
    .setCustomId('champ2')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph) // Multi-lignes
    .setRequired(false)
    .setMaxLength(4096);

// Chaque champ dans sa propre ActionRow (max 5 champs)
modal.addComponents(
    new ActionRowBuilder().addComponents(champCourt),
    new ActionRowBuilder().addComponents(champLong),
);

// Afficher le modal
await interaction.showModal(modal);
```

### Lire les valeurs soumises

```js
if (interaction.isModalSubmit() && interaction.customId === 'mon-modal') {
    const valeur1 = interaction.fields.getTextInputValue('champ1');
    // Lecture sécurisée (sans crash si champ vide) :
    const { getSafeValue } = require('../utils/embedHelper');
    const valeur2 = getSafeValue(interaction, 'champ2');
}
```

---

## 🔘 Boutons

```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('mon-bouton-oui')      // ID unique dans tout le bot
        .setLabel('✅ Confirmer')
        .setStyle(ButtonStyle.Success),      // Primary | Secondary | Success | Danger | Link
    new ButtonBuilder()
        .setCustomId('mon-bouton-non')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false),                 // true = bouton grisé
);

// Envoyer avec boutons
await interaction.reply({ content: 'Confirmer ?', components: [row], ephemeral: true });
```

### Gérer le clic

```js
if (interaction.isButton() && interaction.customId === 'mon-bouton-oui') {
    // Modifier le message original (retire les boutons)
    await interaction.update({ content: '✅ Confirmé !', components: [] });

    // Ou envoyer un nouveau message sans toucher au message original
    await interaction.reply({ content: '✅ Confirmé !', ephemeral: true });
}
```

---

## 🛠️ Fonctions utilitaires disponibles (`utils/embedHelper.js`)

```js
const { buildEmbed, validateColor, getSafeValue, extractEmbedFields } = require('../utils/embedHelper');

// Construire un embed
const embed = buildEmbed({
    title: 'Mon titre',
    description: 'Ma description',
    color: '#FF0000',        // Optionnel
    imageUrl: 'https://…',  // Optionnel
    footer: 'Mon footer',    // Optionnel
    timestamp: true,         // Optionnel, défaut true
});

// Valider une couleur hex
const color = validateColor('#GGG000'); // Retourne '#2b2d31' si invalide

// Lire un champ de modal sans crash
const value = getSafeValue(interaction, 'champ1'); // '' si absent

// Extraire tous les champs d'embed depuis un modal
// (fonctionne si le modal contient : title, description, color, imageUrl, footer)
const fields = extractEmbedFields(interaction);
const embed = buildEmbed(fields);
```

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

---

## 📖 Ressources

- [Discord.js Guide](https://discordjs.guide/) — Guide officiel
- [Discord.js Docs](https://discord.js.org/) — Documentation de l'API
- [Discord Developer Portal](https://discord.com/developers/docs/intro) — Documentation Discord
- [Discohook](https://discohook.org/) — Aperçu visuel d'embeds
