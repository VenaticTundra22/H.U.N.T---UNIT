/**
 * ============================================================
 *  commands/paslu.js — Commande "Pas lu"
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  ─── INSTRUCTIONS D'UTILISATION ──────────────────────────
 *  1. renseigner l'id du message
 *  2. le bot réagit au message avec les émojis pour écrire "Pas lu"
 *  3. commande utilisable par n'importe qui
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
    .setName('paslu')
    .setDescription('Réagi à un message avec les émojis "Pas lu"')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('L\'id du message')
            .setRequired(true)
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
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'paslu') return;

    // ── Lecture des options (si définies) ──────────────────
    const message_id = interaction.options.getString('message_id');

    await interaction.deferReply({ ephemeral: true });

    // ── Votre logique ici ──────────────────────────────────
    const channel = interaction.channel;
    const message = await channel.messages.fetch(message_id);

    const emojis = ['🇵', '🇦', '🇸', '🇱', '🇺'];

    for (const emoji of emojis) {
        await message.react(emoji).catch(console.error);
    }

    await interaction.editReply({
        content: '✅ Commande exécutée avec succès !',
    });
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
