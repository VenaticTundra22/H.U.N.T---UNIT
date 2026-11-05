/**
 * ============================================================
 *  SAY — Template commande simple
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  ─── INSTRUCTIONS D'UTILISATION ──────────────────────────
 *  1. Dire ce que tu veux avec ou sans image.
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
    .setName('say')
    .setDescription('Permet de faire parler le bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

    // ── Options de commande (paramètres) ──────

    .addStringOption(option =>
        option.setName('texte')
            .setDescription('Le message que le bot doit envoyer.')
            .setRequired(true)
    )

    .addAttachmentOption(option =>
        option.setName('image')
            .setDescription('L\'image que le bot doit envoyer.')
            .setRequired(false)
    );

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
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'say') return;

    // ── Lecture des options (si définies) ──────────────────
    const texte = interaction.options.getString('texte');
    const image = interaction.options.getAttachment('image');

    // ── Votre logique ici ──────────────────────────────────

    if (image) {
        await interaction.channel.send({ content: texte, files: [image.url] });
    } else {
        await interaction.channel.send(texte);
    }

    await interaction.reply({ content: '✅ Commande exécutée avec succès !', ephemeral: true });
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
