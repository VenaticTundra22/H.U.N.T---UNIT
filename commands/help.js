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

    // ─── Description avec sections groupées (style image de référence) ───
    const description = [
        // ── Section 1 : Construction ──────────────────────────────
        '> `/builder` — Ouvre le terminal de construction avancé',
        '> `/embed` — Crée et prévisualise un embed personnalisé',
        '> `/clear` — Supprime un nombre défini de messages dans un salon',

        '\u200b', // Ligne vide entre sections

        // ── Section 2 : Aide ──────────────────────────────────────
        '> `/help` — Affiche cette liste de commandes',

    ].join('\n');

    const helpEmbed = new EmbedBuilder()
        .setTitle('📋 Vue d\'ensemble — H.U.N.T - UNIT')
        .setDescription(description)
        .setColor(0x5865F2)              // Bleu Discord

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


    // ─── Bouton "Documentation" (facultatif — style bouton de l'image) ───
    // Remplacez l'URL par votre lien si besoin, ou supprimez ce bloc.
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('📖 Documentation')
            .setStyle(ButtonStyle.Link)
            .setURL('https://venatictundra22.com/projets/hunt'),
    );

    await interaction.reply({
        embeds: [helpEmbed, statsEmbed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = { definition, handleInteraction };
