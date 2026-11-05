/**
 * ============================================================
 *  commands/help.js — Commande /help
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Design inspiré de l'image de référence :
 *    - Commandes en inline code dans la description
 *    - Sections groupées séparées par des lignes vides
 *    - Barre colorée à gauche (couleur embed)
 *    - Thumbnail avec l'avatar du bot
 *    - Bouton lien en bas (optionnel)
 */

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');

const definition = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles');

async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'help') return;

    // ─── Sections de l'embed ───

    const helpEmbed = new EmbedBuilder()
        .setTitle('📋 Commandes — H.U.N.T - UNIT')
        .setColor(0x5865F2)
        .addFields(
            {
                name: '🛠️ Modération',
                value: [
                    '> `/builder` — Ouvre le terminal de construction avancé',
                    '> `/embed` — Crée et prévisualise un embed personnalisé',
                    '> `/clear` — Supprime un nombre défini de messages dans un salon',
                    '> `/reactionrole` — Lance la configuration d\'un panneau de réaction role',
                ].join('\n'),
            },
            {
                name: '💾 Sauvegarde & Importation',
                value: [
                    '> `/sauvegarder-serveur` — Sauvegarde un serveur dans un fichier .json',
                    '> `/importer-serveur` — Importe un serveur via un fichier .json',
                ].join('\n'),
            },
            {
                name: '🎉 Fun',
                value: [
                    '> `/say` — Fais parler le bot avec ou sans image',
                    '> `/paslu` — Réagi à un message avec les émojis "Pas lu"',
                ].join('\n'),
            },
            {
                name: 'ℹ️ Aide',
                value: '> `/help` — Affiche cette liste de commandes',
            },
        )

    // ── Stats du bot (nb de serveurs dont il est membre, latence) ────────────────────────────────────
    const statsEmbed = new EmbedBuilder()
        .setTitle('📊 H.U.N.T - UNIT Stats')
        .addFields(
            { name: 'Serveurs', value: interaction.client.guilds.cache.size.toString(), inline: true },
            { name: 'Latence', value: `${interaction.client.ws.ping} ms`, inline: true },
        )
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({
            text: 'H.U.N.T - UNIT | VT22s Productions',
            iconURL: interaction.client.user.displayAvatarURL(),
        });


    // ─── Bouton "Documentation" ───
    // Remplacez l'URL par votre lien si besoin, ou supprimez ce bloc.
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('📖 Documentation')
            .setStyle(ButtonStyle.Link)
            .setURL('https://venatictundra22.com/projets/hunt-unit'),
    );

    await interaction.reply({
        embeds: [helpEmbed, statsEmbed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = { definition, handleInteraction };
