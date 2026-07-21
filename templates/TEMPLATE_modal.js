/**
 * ============================================================
 *  templates/TEMPLATE_modal.js — Template commande avec Modal
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Cas d'usage : commande qui ouvre un formulaire Discord (modal).
 *  Exemples    : /embed, /annonce, /ticket, /rapport
 *
 *  Un modal peut avoir entre 1 et 5 champs texte.
 *
 *  ─── INSTRUCTIONS D'UTILISATION ──────────────────────────
 *  1. Copier ce fichier dans /commands sous un nouveau nom
 *     Ex : cp templates/TEMPLATE_modal.js commands/annonce.js
 *  2. Renommer les IDs (chercher/remplacer 'ma-commande')
 *  3. Adapter les champs du modal et la logique de soumission
 *  4. Redémarrer le bot
 *  ──────────────────────────────────────────────────────────
 *
 *  ─── RÈGLE IMPORTANTE SUR LES customIds ──────────────────
 *  Chaque modal et chaque champ doit avoir un customId UNIQUE
 *  dans tout le bot pour éviter les conflits entre commandes.
 *  Convention recommandée : 'nomcommande_nomchamp'
 *  Exemples : 'annonce_modal', 'annonce_titre', 'annonce_corps'
 *  ──────────────────────────────────────────────────────────
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
} = require('discord.js');

const { getSafeValue } = require('../utils/embedHelper');

// ─────────────────────────────────────────────
//  Définition de la commande Slash
// ─────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Description de la commande')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─────────────────────────────────────────────
//  Construction du Modal
//  (extraite en fonction pour lisibilité)
// ─────────────────────────────────────────────

function buildModal() {
    const modal = new ModalBuilder()
        .setCustomId('ma-commande_modal')   // ← ID unique du modal
        .setTitle('Titre du formulaire');   // ← Titre affiché à l'utilisateur

    // ── Champ 1 : Texte court (Short) ─────────────────────
    const champCourt = new TextInputBuilder()
        .setCustomId('ma-commande_champ1')  // ← ID unique du champ
        .setLabel('Libellé du champ 1')     // ← Visible dans le formulaire
        .setStyle(TextInputStyle.Short)     // ← Short = une ligne
        .setPlaceholder('Exemple de valeur attendue')
        .setMinLength(1)
        .setMaxLength(256)
        .setRequired(true);

    // ── Champ 2 : Texte long (Paragraph) ──────────────────
    const champLong = new TextInputBuilder()
        .setCustomId('ma-commande_champ2')
        .setLabel('Libellé du champ 2')
        .setStyle(TextInputStyle.Paragraph) // ← Paragraph = multi-lignes
        .setMaxLength(4000)
        .setRequired(false);

    // ── Champ 3 : Optionnel avec valeur pré-remplie ────────
    // const champOptionel = new TextInputBuilder()
    //     .setCustomId('ma-commande_champ3')
    //     .setLabel('Champ optionnel')
    //     .setStyle(TextInputStyle.Short)
    //     .setValue('Valeur par défaut')    // ← Pré-rempli
    //     .setRequired(false);

    // Chaque champ doit être dans sa propre ActionRowBuilder
    // Maximum 5 champs par modal
    modal.addComponents(
        new ActionRowBuilder().addComponents(champCourt),
        new ActionRowBuilder().addComponents(champLong),
        // new ActionRowBuilder().addComponents(champOptionel),
    );

    return modal;
}

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

async function handleInteraction(interaction) {
    // ── 1. Commande slash → ouvre le modal ──────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'ma-commande') {
        await interaction.showModal(buildModal());
        return;
    }

    // ── 2. Soumission du modal → traitement des données ─────
    if (interaction.isModalSubmit() && interaction.customId === 'ma-commande_modal') {
        // Lecture sécurisée des champs (pas de crash si champ vide)
        const valeur1 = getSafeValue(interaction, 'ma-commande_champ1');
        const valeur2 = getSafeValue(interaction, 'ma-commande_champ2');

        // ── Votre logique ici ────────────────────────────────

        // Exemple : construire et envoyer un embed
        const embed = new EmbedBuilder()
            .setTitle(valeur1)
            .setDescription(valeur2 || '_Aucune description fournie._')
            .setColor('#5865F2')
            .setTimestamp()
            .setFooter({ text: `Créé par ${interaction.user.tag}` });

        // Envoyer dans le salon courant
        await interaction.channel.send({ embeds: [embed] });

        // Confirmer à l'utilisateur (éphémère)
        await interaction.reply({
            content: '✅ Message envoyé avec succès !',
            ephemeral: true,
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
