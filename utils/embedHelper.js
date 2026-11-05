/**
 * ============================================================
 *  utils/embedHelper.js — Fonctions utilitaires partagées
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Ce fichier contient les fonctions communes utilisées par
 *  plusieurs commandes : construction d'embeds, validation
 *  de couleurs, lecture sécurisée des champs de modaux.
 *
 *  Importation dans une commande :
 *    const { buildEmbed, validateColor, getSafeValue } = require('../utils/embedHelper');
 */

const { EmbedBuilder } = require('discord.js');

// ─────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────

/** Couleur par défaut si aucune n'est fournie (gris Discord) */
const DEFAULT_COLOR = '#2b2d31';

/** Footer par défaut */
const DEFAULT_FOOTER = 'H.U.N.T - UNIT | Secure System';

/** Regex pour valider un code couleur hexadécimal */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// ─────────────────────────────────────────────
//  Fonctions utilitaires
// ─────────────────────────────────────────────

/**
 * Lit un champ de modal de façon sécurisée (sans crash si absent).
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {string} id - customId du champ TextInput
 * @returns {string} La valeur du champ, ou '' si absent
 */
function getSafeValue(interaction, id) {
    try {
        return interaction.fields.getTextInputValue(id) ?? '';
    } catch {
        return '';
    }
}

/**
 * Valide et retourne une couleur hexadécimale.
 * Retourne DEFAULT_COLOR si la valeur est invalide ou vide.
 *
 * @param {string} rawColor - Couleur brute saisie par l'utilisateur
 * @returns {string} Couleur hex validée
 */
function validateColor(rawColor) {
    if (rawColor && HEX_COLOR_REGEX.test(rawColor)) {
        return rawColor.toUpperCase();
    }
    return DEFAULT_COLOR;
}

/**
 * Construit un EmbedBuilder à partir d'un objet de champs.
 *
 * @param {Object} fields
 * @param {string} fields.title       - Titre de l'embed (requis)
 * @param {string} fields.description - Description (requis)
 * @param {string} [fields.color]     - Couleur hex (optionnel)
 * @param {string} [fields.imageUrl]  - URL de l'image (optionnel)
 * @param {string} [fields.footer]    - Texte du footer (optionnel)
 * @param {boolean} [fields.timestamp=true] - Afficher le timestamp
 * @returns {EmbedBuilder}
 */
function buildEmbed({ title, description, color, imageUrl, footer, timestamp = true }) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(validateColor(color))
        .setFooter({ text: footer || DEFAULT_FOOTER });

    if (timestamp) {
        embed.setTimestamp();
    }

    if (imageUrl) {
        try {
            new URL(imageUrl); // Validation stricte de l'URL
            embed.setImage(imageUrl);
        } catch {
            // URL invalide → on ignore silencieusement
        }
    }

    return embed;
}

/**
 * Extrait les champs d'un modal d'embed et retourne un objet structuré.
 * Utilisé par /embed et /builder pour éviter la duplication.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {{ title, description, color, imageUrl, footer }}
 */
function extractEmbedFields(interaction) {
    return {
        title:       getSafeValue(interaction, 'title'),
        description: getSafeValue(interaction, 'description'),
        color:       getSafeValue(interaction, 'color'),
        imageUrl:    getSafeValue(interaction, 'imageUrl'),
        footer:      getSafeValue(interaction, 'footer'),
    };
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = {
    DEFAULT_COLOR,
    DEFAULT_FOOTER,
    getSafeValue,
    validateColor,
    buildEmbed,
    extractEmbedFields,
};
