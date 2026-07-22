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
} = require('discord.js');



const definition = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre défini de messages dans ce salon.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Seul un modérateur peut l'utiliser

    .addIntegerOption(option =>
        option.setName('nombre')
            .setDescription('Le nombre de messages à supprimer.')
            .setMinValue(1)
            .setMaxValue(100)
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
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'clear') return;

    const nombre = interaction.options.getInteger('nombre');

    // Mettre l'interaction en attente (ephemeral)
    await interaction.deferReply({ ephemeral: true });

    try {
        // Suppression en masse. Le "true" ignore les messages > 14 jours (API Discord oblige)
        const deleted = await interaction.channel.bulkDelete(nombre, true);

        await interaction.editReply({
            content: `✅ **${deleted.size}** message(s) supprimé(s) avec succès !`
        });
    } catch (error) {
        console.error('[H.U.N.T - UNIT] Erreur bulkDelete :', error);
        await interaction.editReply({
            content: '❌ Une erreur est survenue lors de la suppression des messages (vérifiez que le bot a les droits ou que les messages ne datent pas de plus de 14 jours).'
        });
    }
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
