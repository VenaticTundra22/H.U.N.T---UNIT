/**
 * ============================================================
 *  templates/TEMPLATE_simple.js — Template commande simple
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Cas d'usage : commande sans modal ni boutons.
 *  Exemples    : /ping, /info, /stats, /aide
 *
 *  ─── INSTRUCTIONS D'UTILISATION ──────────────────────────
 *  1. Copier ce fichier dans /commands sous un nouveau nom
 *     Ex : cp templates/TEMPLATE_simple.js commands/ping.js
 *  2. Renommer la commande (chercher/remplacer 'ma-commande')
 *  3. Remplir la logique dans handleInteraction()
 *  4. Redémarrer le bot → la commande est automatiquement chargée
 *  ──────────────────────────────────────────────────────────
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');

// ─────────────────────────────────────────────
//  Définition de la commande Slash
//  Documentation : https://discordjs.guide/slash-commands/advanced-creation.html
// ─────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('ma-commande')               // ← Nom de la commande (minuscules, tirets)
    .setDescription('Description courte de la commande')
    // Décommenter la ligne suivante pour restreindre aux admins :
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // ── Options de commande (paramètres) ──────
    // Décommenter et adapter selon vos besoins :

    // Option texte :
    // .addStringOption(option =>
    //     option.setName('texte')
    //           .setDescription('Un texte en entrée')
    //           .setRequired(true)
    // )

    // Option nombre entier :
    // .addIntegerOption(option =>
    //     option.setName('nombre')
    //           .setDescription('Un nombre entier')
    //           .setMinValue(1)
    //           .setMaxValue(100)
    //           .setRequired(false)
    // )

    // Option utilisateur :
    // .addUserOption(option =>
    //     option.setName('utilisateur')
    //           .setDescription('Un utilisateur Discord')
    //           .setRequired(false)
    // )

    // Option salon :
    // .addChannelOption(option =>
    //     option.setName('salon')
    //           .setDescription('Un salon Discord')
    //           .setRequired(false)
    // )

    // Option choix prédéfinis :
    // .addStringOption(option =>
    //     option.setName('categorie')
    //           .setDescription('Choisissez une catégorie')
    //           .setRequired(true)
    //           .addChoices(
    //               { name: 'Option A', value: 'a' },
    //               { name: 'Option B', value: 'b' },
    //           )
    // )
;

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

/**
 * Gère les interactions de cette commande.
 * Appelé automatiquement par index.js pour chaque interaction.
 *
 * @param {import('discord.js').Interaction} interaction
 */
async function handleInteraction(interaction) {
    // Seule la commande slash nous concerne ici
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ma-commande') return;

    // ── Lecture des options (si définies) ──────────────────
    // const texte = interaction.options.getString('texte');
    // const nombre = interaction.options.getInteger('nombre') ?? 10;
    // const user = interaction.options.getUser('utilisateur') ?? interaction.user;

    // ── Votre logique ici ──────────────────────────────────

    // Exemple 1 : Réponse texte simple
    await interaction.reply({
        content: '✅ Commande exécutée avec succès !',
        ephemeral: true, // true = visible uniquement par l'utilisateur
    });

    // Exemple 2 : Réponse avec embed
    // const embed = new EmbedBuilder()
    //     .setTitle('Titre de l\'embed')
    //     .setDescription('Description ici')
    //     .setColor('#5865F2')
    //     .setTimestamp();
    //
    // await interaction.reply({ embeds: [embed], ephemeral: false });

    // Exemple 3 : Réponse différée (pour les opérations longues)
    // await interaction.deferReply({ ephemeral: true });
    // // ... opération longue ...
    // await interaction.editReply({ content: '✅ Terminé !' });
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
