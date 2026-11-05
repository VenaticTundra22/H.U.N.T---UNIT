/**
 * ============================================================
 *  templates/TEMPLATE_buttons.js — Template commande avec boutons
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Cas d'usage : commande qui affiche des boutons interactifs.
 *  Exemples    : /menu, /vote, /confirm, /role-picker
 *
 *  Règles Discord sur les boutons :
 *    - Max 5 boutons par ActionRow
 *    - Max 5 ActionRows par message (25 boutons au total)
 *    - Les boutons disparaissent après interaction.update() ou
 *      peuvent rester si on veut un panneau persistant
 *
 *  ─── INSTRUCTIONS D'UTILISATION ──────────────────────────
 *  1. Copier ce fichier dans /commands sous un nouveau nom
 *  2. Renommer les IDs (chercher/remplacer 'ma-commande')
 *  3. Adapter les boutons et la logique de chaque bouton
 *  4. Redémarrer le bot
 *  ──────────────────────────────────────────────────────────
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

// ─────────────────────────────────────────────
//  Définition de la commande Slash
// ─────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Description de la commande')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─────────────────────────────────────────────
//  Liste des customIds des boutons
//  → Permet de filtrer rapidement dans handleInteraction
// ─────────────────────────────────────────────

const BUTTON_IDS = [
    'ma-commande_btn_oui',
    'ma-commande_btn_non',
    'ma-commande_btn_plus_info',
];

// ─────────────────────────────────────────────
//  Construction des boutons
// ─────────────────────────────────────────────

function buildButtons() {
    const row = new ActionRowBuilder().addComponents(
        // ── Styles disponibles : ────────────────────────────
        //   ButtonStyle.Primary   → Bleu
        //   ButtonStyle.Secondary → Gris
        //   ButtonStyle.Success   → Vert
        //   ButtonStyle.Danger    → Rouge
        //   ButtonStyle.Link      → Lien externe (pas de handler)
        new ButtonBuilder()
            .setCustomId('ma-commande_btn_oui')
            .setLabel('✅ Oui')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('ma-commande_btn_non')
            .setLabel('❌ Non')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('ma-commande_btn_plus_info')
            .setLabel('ℹ️ Plus d\'infos')
            .setStyle(ButtonStyle.Secondary),

        // Bouton lien externe (pas de handler needed) :
        // new ButtonBuilder()
        //     .setLabel('🌐 Voir le site')
        //     .setStyle(ButtonStyle.Link)
        //     .setURL('https://example.com'),
    );

    // Si vous avez besoin d'une 2ème rangée de boutons :
    // const row2 = new ActionRowBuilder().addComponents( ... );
    // return [row, row2];

    return [row];
}

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

async function handleInteraction(interaction) {
    // ── 1. Commande slash → affiche les boutons ──────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'ma-commande') {
        const embed = new EmbedBuilder()
            .setTitle('Titre du message avec boutons')
            .setDescription('Choisissez une option ci-dessous.')
            .setColor('#5865F2');

        await interaction.reply({
            embeds: [embed],
            components: buildButtons(),
            ephemeral: true, // Mettre false pour que tous voient les boutons
        });
        return;
    }

    // ── 2. Clic sur un bouton ────────────────────────────────
    if (interaction.isButton() && BUTTON_IDS.includes(interaction.customId)) {

        // Optionnel : vérifier que c'est bien l'auteur du message
        // if (interaction.user.id !== interaction.message.interaction?.user?.id) {
        //     return interaction.reply({ content: '❌ Ce n\'est pas votre menu.', ephemeral: true });
        // }

        switch (interaction.customId) {
            case 'ma-commande_btn_oui':
                // interaction.update() → modifie le message original (retire les boutons)
                await interaction.update({
                    content: '✅ Vous avez confirmé !',
                    embeds: [],
                    components: [], // Retire les boutons
                });
                break;

            case 'ma-commande_btn_non':
                await interaction.update({
                    content: '❌ Action annulée.',
                    embeds: [],
                    components: [],
                });
                break;

            case 'ma-commande_btn_plus_info':
                // interaction.reply() → envoie un nouveau message (éphémère ici)
                // sans modifier le message original avec les boutons
                await interaction.reply({
                    content: 'ℹ️ Voici des informations supplémentaires…',
                    ephemeral: true,
                });
                break;
        }
    }
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = {
    definition,
    handleInteraction,
};
