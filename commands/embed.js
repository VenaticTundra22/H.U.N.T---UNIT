/**
 * ============================================================
 *  commands/embed.js — Commande /embed
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Workflow :
 *    1. /embed         → Ouvre un modal de configuration
 *    2. Modal submit   → Affiche une PREVIEW éphémère + boutons
 *    3. Bouton Confirm → Envoie l'embed dans le salon
 *    4. Bouton Edit    → Rouvre le modal pour modifier
 *    5. Bouton Cancel  → Annule et supprime la preview
 *
 *  Registre des customIds utilisés :
 *    - Modal  : 'embed_modal'
 *    - Bouton : 'embed_confirm', 'embed_edit', 'embed_cancel'
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const { buildEmbed, extractEmbedFields } = require('../utils/embedHelper');

// ─────────────────────────────────────────────
//  Stockage temporaire des previews en attente
//  clé : userId, valeur : EmbedBuilder
// ─────────────────────────────────────────────
const pendingEmbeds = new Map();

// ─────────────────────────────────────────────
//  Définition de la commande Slash
// ─────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Ouvre un terminal pour configurer et prévisualiser un embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─────────────────────────────────────────────
//  Helpers internes
// ─────────────────────────────────────────────

/** Construit le modal de configuration */
function buildEmbedModal() {
    const modal = new ModalBuilder()
        .setCustomId('embed_modal')
        .setTitle('Terminal H.U.N.T - UNIT');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('title')
                .setLabel("Titre de l'embed")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(256)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description (Markdown supporté)')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(4000)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Couleur Hexadécimale (ex: #FF0000)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('#2b2d31')
                .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('imageUrl')
                .setLabel("URL de l'image (optionnel)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Texte du Footer (optionnel)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2000)
                .setRequired(false)
        )
    );

    return modal;
}

/** Construit la rangée de boutons de preview */
function buildPreviewButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('embed_confirm')
            .setLabel('✅ Envoyer')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('embed_edit')
            .setLabel('✏️ Modifier')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('embed_cancel')
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Danger)
    );
}

// ─────────────────────────────────────────────
//  Handlers d'interactions
// ─────────────────────────────────────────────

/**
 * Gère toutes les interactions liées à la commande /embed.
 * @param {import('discord.js').Interaction} interaction
 */
async function handleInteraction(interaction) {
    // ── 1. Commande slash → ouvre le modal ──────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
        await interaction.showModal(buildEmbedModal());
        return;
    }

    // ── 2. Soumission du modal → affiche la preview ─────────
    if (interaction.isModalSubmit() && interaction.customId === 'embed_modal') {
        const fields = extractEmbedFields(interaction);
        const embed = buildEmbed(fields);

        // Sauvegarde de l'embed en attente pour cet utilisateur
        pendingEmbeds.set(interaction.user.id, embed);

        await interaction.reply({
            content: [
                '### 👁️ Prévisualisation de votre embed',
                'Vérifiez le rendu ci-dessous, puis confirmez ou modifiez.',
                '',
                '> ⚠️ Seul vous voyez ce message.',
            ].join('\n'),
            embeds: [embed],
            components: [buildPreviewButtons()],
            ephemeral: true,
        });
        return;
    }

    // ── 3. Boutons de la preview ─────────────────────────────
    if (interaction.isButton() && ['embed_confirm', 'embed_edit', 'embed_cancel'].includes(interaction.customId)) {
        const embed = pendingEmbeds.get(interaction.user.id);

        if (!embed) {
            await interaction.reply({
                content: '⚠️ Session expirée. Veuillez refaire `/embed`.',
                ephemeral: true,
            });
            return;
        }

        if (interaction.customId === 'embed_confirm') {
            // Envoie l'embed dans le salon et nettoie la session
            await interaction.channel.send({ embeds: [embed] });
            pendingEmbeds.delete(interaction.user.id);
            await interaction.update({
                content: '✅ Embed envoyé avec succès dans ' + interaction.channel.toString() + ' !',
                embeds: [],
                components: [],
            });

        } else if (interaction.customId === 'embed_edit') {
            // Rouvre le modal pour permettre des modifications
            // Note : on garde l'embed en mémoire, il sera écrasé au prochain submit
            await interaction.showModal(buildEmbedModal());

        } else if (interaction.customId === 'embed_cancel') {
            pendingEmbeds.delete(interaction.user.id);
            await interaction.update({
                content: '❌ Création de l\'embed annulée.',
                embeds: [],
                components: [],
            });
        }
    }
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
