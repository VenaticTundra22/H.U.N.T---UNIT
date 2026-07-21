/**
 * ============================================================
 *  commands/builder.js — Commande /builder (Multi-embeds)
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Workflow :
 *    1. /builder         → Ouvre le panneau de construction
 *    2. 📝 Texte         → Modal pour le texte hors-embed
 *    3. 🖼️ Ajouter Embed → Modal pour ajouter un embed
 *    4. 🗑️ Suppr. dernier→ Retire le dernier embed de la session
 *    5. 👁️ Preview       → Aperçu éphémère du message complet
 *    6. ✅ Envoyer       → Publie le message dans le salon
 *    7. ❌ Annuler       → Supprime la session
 *
 *  Registre des customIds utilisés :
 *    Boutons : 'build_text', 'build_embed', 'build_remove_last',
 *              'build_preview', 'build_send', 'build_cancel'
 *    Modaux  : 'modal_build_text', 'modal_build_embed'
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

const { buildEmbed, extractEmbedFields, getSafeValue } = require('../utils/embedHelper');

// ─────────────────────────────────────────────
//  Stockage des sessions de construction
//  clé : userId
//  valeur : { content: string|null, embeds: EmbedBuilder[] }
// ─────────────────────────────────────────────
const builderSessions = new Map();

// ─────────────────────────────────────────────
//  Définition de la commande Slash
// ─────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('builder')
    .setDescription('Ouvre le constructeur avancé (multi-embeds, texte, preview)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─────────────────────────────────────────────
//  Helpers internes
// ─────────────────────────────────────────────

/** Construit le panneau principal du builder avec statut */
function buildBuilderPanel(session) {
    const embedCount = session.embeds.length;
    const hasText    = !!session.content;

    const statusLines = [
        '### 🛠️ Terminal de Construction Avancé',
        'Composez votre message avec les boutons ci-dessous.',
        '',
        '**Statut actuel :**',
        `- 📝 Texte  : ${hasText ? `\`${session.content.slice(0, 40)}${session.content.length > 40 ? '…' : ''}\`` : 'Aucun'}`,
        `- 🖼️ Embeds : ${embedCount}/10`,
        '',
        '_Utilisez **Preview** pour voir le rendu avant d\'envoyer._',
    ].join('\n');

    return statusLines;
}

/** Construit les rangées de boutons du builder */
function buildBuilderButtons(session) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('build_text')
            .setLabel('📝 Texte')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('build_embed')
            .setLabel('🖼️ Ajouter Embed')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(session.embeds.length >= 10),
        new ButtonBuilder()
            .setCustomId('build_remove_last')
            .setLabel('🗑️ Suppr. dernier embed')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(session.embeds.length === 0),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('build_preview')
            .setLabel('👁️ Preview')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!session.content && session.embeds.length === 0),
        new ButtonBuilder()
            .setCustomId('build_send')
            .setLabel('✅ Envoyer')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!session.content && session.embeds.length === 0),
        new ButtonBuilder()
            .setCustomId('build_cancel')
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Danger),
    );

    return [row1, row2];
}

/** Modal pour le texte hors-embed */
function buildTextModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal_build_text')
        .setTitle('Texte du message');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Contenu (affiché au-dessus des embeds)')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(2000)
                .setRequired(true)
        )
    );

    return modal;
}

/** Modal pour ajouter un embed */
function buildAddEmbedModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal_build_embed')
        .setTitle('Nouvel Embed');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Titre')
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
                .setLabel('Couleur Hex (ex: #FF0000)')
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

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

const BUTTON_IDS = ['build_text', 'build_embed', 'build_remove_last', 'build_preview', 'build_send', 'build_cancel'];
const MODAL_IDS  = ['modal_build_text', 'modal_build_embed'];

/**
 * Gère toutes les interactions liées à la commande /builder.
 * @param {import('discord.js').Interaction} interaction
 */
async function handleInteraction(interaction) {
    // ── 1. Commande slash → crée la session et ouvre le panneau ──
    if (interaction.isChatInputCommand() && interaction.commandName === 'builder') {
        const session = { content: null, embeds: [] };
        builderSessions.set(interaction.user.id, session);

        await interaction.reply({
            content: buildBuilderPanel(session),
            components: buildBuilderButtons(session),
            ephemeral: true,
        });
        return;
    }

    // ── 2. Gestion des boutons ────────────────────────────────────
    if (interaction.isButton() && BUTTON_IDS.includes(interaction.customId)) {
        const session = builderSessions.get(interaction.user.id);

        if (!session) {
            await interaction.reply({
                content: '⚠️ Session expirée. Veuillez refaire `/builder`.',
                ephemeral: true,
            });
            return;
        }

        switch (interaction.customId) {
            case 'build_text':
                await interaction.showModal(buildTextModal());
                break;

            case 'build_embed':
                if (session.embeds.length >= 10) {
                    await interaction.reply({ content: '⚠️ Limite de 10 embeds atteinte (limite API Discord).', ephemeral: true });
                } else {
                    await interaction.showModal(buildAddEmbedModal());
                }
                break;

            case 'build_remove_last':
                if (session.embeds.length > 0) {
                    session.embeds.pop();
                }
                await interaction.update({
                    content: buildBuilderPanel(session),
                    components: buildBuilderButtons(session),
                });
                break;

            case 'build_preview':
                if (!session.content && session.embeds.length === 0) {
                    await interaction.reply({ content: '⚠️ Le message est vide, rien à prévisualiser.', ephemeral: true });
                } else {
                    // Defer update pour éviter le timeout, puis envoyer la preview séparément
                    await interaction.reply({
                        content: [
                            '### 👁️ Prévisualisation du message',
                            session.content ? `**Texte :** ${session.content}` : '',
                            `**Embeds :** ${session.embeds.length}`,
                            '',
                            '> ⚠️ Seul vous voyez ce message.',
                        ].filter(Boolean).join('\n'),
                        embeds: session.embeds.slice(0, 10), // Max 10 par l'API Discord
                        ephemeral: true,
                    });
                }
                break;

            case 'build_send':
                if (!session.content && session.embeds.length === 0) {
                    await interaction.reply({ content: '⚠️ Le message est complètement vide !', ephemeral: true });
                } else {
                    await interaction.channel.send({
                        content: session.content || undefined,
                        embeds: session.embeds,
                    });
                    builderSessions.delete(interaction.user.id);
                    await interaction.update({
                        content: '✅ Message publié avec succès dans ' + interaction.channel.toString() + ' !',
                        components: [],
                    });
                }
                break;

            case 'build_cancel':
                builderSessions.delete(interaction.user.id);
                await interaction.update({
                    content: '❌ Construction annulée. La session a été supprimée.',
                    components: [],
                });
                break;
        }
        return;
    }

    // ── 3. Gestion des modaux ─────────────────────────────────────
    if (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId)) {
        const session = builderSessions.get(interaction.user.id);

        if (!session) {
            await interaction.reply({ content: '⚠️ Session expirée. Veuillez refaire `/builder`.', ephemeral: true });
            return;
        }

        if (interaction.customId === 'modal_build_text') {
            session.content = getSafeValue(interaction, 'content');
        } else if (interaction.customId === 'modal_build_embed') {
            const fields = extractEmbedFields(interaction);
            session.embeds.push(buildEmbed(fields));
        }

        await interaction.update({
            content: buildBuilderPanel(session),
            components: buildBuilderButtons(session),
        });
    }
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
