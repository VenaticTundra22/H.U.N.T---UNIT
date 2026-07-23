/**
 * ============================================================
 *  commands/reactionrole.js — Panneau de rôles interactif
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *  Utilise Discord Components V2 (discord.js ≥ 14.18)
 *  SectionBuilder → texte à gauche + bouton à droite par ligne
 */

const {
    SlashCommandBuilder, PermissionFlagsBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    RoleSelectMenuBuilder, ContainerBuilder,
    SectionBuilder, TextDisplayBuilder,
    SeparatorBuilder, SeparatorSpacingSize, MessageFlags,
} = require('discord.js');

const { validateColor } = require('../utils/embedHelper');

// Cache temporaire : userId → { title, footer, color, roles[] }
const setupCache = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function input(id, label, style, opts = {}) {
    return new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style)
            .setRequired(opts.required ?? false)
            .setValue(opts.value ?? '')
            .setPlaceholder(opts.placeholder ?? '')
    );
}

function buildPanel(config) {
    const color = parseInt(validateColor(config.color).replace('#', ''), 16);
    const container = new ContainerBuilder().setAccentColor(color);

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${config.title}`));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    for (const role of config.roles) {
        const btn = new ButtonBuilder()
            .setCustomId(`rr_role_${role.id}`)
            .setLabel(role.label)
            .setStyle(ButtonStyle.Secondary);
        if (role.emoji) try { btn.setEmoji(role.emoji); } catch (_) { }

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(role.description))
                .setButtonAccessory(btn)
        );
    }

    if (config.footer) {
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${config.footer}`));
    }

    return container;
}

function buildControls() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rr_setup_embed').setLabel('📝 Modifier textes').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rr_setup_add_role').setLabel('➕ Ajouter un rôle').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('rr_setup_reset').setLabel('🔄 Reset rôles').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('rr_setup_send').setLabel('✅ Envoyer').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('rr_setup_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger),
    );
}

async function showPreview(interaction, config, update = false) {
    const payload = {
        components: [buildPanel(config), buildControls()],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    };
    await (update ? interaction.update(payload) : interaction.reply(payload));
}

// ─── Commande ─────────────────────────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Créer un panneau de rôles interactif (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function handleInteraction(interaction) {

    // 1. Lancement de la commande
    if (interaction.isChatInputCommand() && interaction.commandName === 'reactionrole') {
        setupCache.set(interaction.user.id, {
            title: 'Attribuez / retirez vous des rôles de notifications',
            footer: 'Nous vous souhaitons un excellent séjour sur le serveur !',
            color: '#2b2d31',
            roles: [],
        });
        await showPreview(interaction, setupCache.get(interaction.user.id));
        return;
    }

    // 2. Boutons
    if (interaction.isButton()) {
        const config = setupCache.get(interaction.user.id);
        const { customId } = interaction;

        // Boutons de setup (session requise)
        if (customId.startsWith('rr_setup_')) {
            if (!config) return interaction.reply({ content: '❌ Session expirée. Relancez `/reactionrole`.', ephemeral: true });

            if (customId === 'rr_setup_embed') {
                return interaction.showModal(
                    new ModalBuilder().setCustomId('rr_modal_embed').setTitle('Modifier les textes').addComponents(
                        input('title', 'Titre', TextInputStyle.Short, { required: true, value: config.title }),
                        input('footer', 'Footer (optionnel)', TextInputStyle.Short, { value: config.footer }),
                        input('color', 'Couleur hex (optionnel)', TextInputStyle.Short, { value: config.color, placeholder: '#5865F2' }),
                    )
                );
            }

            if (customId === 'rr_setup_add_role') {
                if (config.roles.length >= 20) return interaction.reply({ content: '❌ Maximum 20 rôles.', ephemeral: true });
                return interaction.update({
                    components: [
                        new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('rr_setup_select_role').setPlaceholder('Sélectionnez un rôle...')),
                        new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rr_setup_back').setLabel('← Retour').setStyle(ButtonStyle.Secondary)),
                    ]
                });
            }

            if (customId === 'rr_setup_back') return showPreview(interaction, config, true);
            if (customId === 'rr_setup_reset') { config.roles = []; return showPreview(interaction, config, true); }

            if (customId === 'rr_setup_send') {
                if (!config.roles.length) return interaction.reply({ content: '❌ Ajoutez au moins un rôle !', ephemeral: true });
                await interaction.channel.send({ components: [buildPanel(config)], flags: [MessageFlags.IsComponentsV2] });
                setupCache.delete(interaction.user.id);
                // On doit garder le flag IsComponentsV2 lors de la mise à jour d'un message V2
                return interaction.update({
                    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('✅ Panneau déployé avec succès !'))],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                });
            }

            if (customId === 'rr_setup_cancel') {
                setupCache.delete(interaction.user.id);
                // On doit garder le flag IsComponentsV2 lors de la mise à jour d'un message V2
                return interaction.update({
                    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Création annulée.'))],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                });
            }
        }

        // Clic utilisateur sur un bouton de rôle
        if (customId.startsWith('rr_role_')) {
            const roleId = customId.replace('rr_role_', '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return interaction.reply({ content: '❌ Ce rôle n\'existe plus.', ephemeral: true });

            try {
                const has = interaction.member.roles.cache.has(roleId);
                await (has ? interaction.member.roles.remove(roleId) : interaction.member.roles.add(roleId));
                await interaction.reply({ content: `${has ? '➖ Rôle retiré' : '➕ Rôle attribué'} : **${role.name}**`, ephemeral: true });
            } catch {
                await interaction.reply({ content: '❌ Erreur de permissions. Le rôle du bot doit être au-dessus du rôle distribué.', ephemeral: true });
            }
        }
    }

    // 3. Sélection d'un rôle → modal de personnalisation du bouton
    if (interaction.isRoleSelectMenu() && interaction.customId === 'rr_setup_select_role') {
        const roleId = interaction.values[0];
        const roleName = interaction.guild.roles.cache.get(roleId)?.name || roleId;
        return interaction.showModal(
            new ModalBuilder().setCustomId(`rr_modal_role_${roleId}`).setTitle(`Configurer : ${roleName}`).addComponents(
                input('description', 'Texte à gauche (description)', TextInputStyle.Short, { required: true, placeholder: 'Ex: Annonces du serveur Discord' }),
                input('label', 'Texte du bouton (optionnel)', TextInputStyle.Short, { placeholder: 'Laissez vide pour le nom du rôle' }),
                input('emoji', 'Emoji du bouton (optionnel)', TextInputStyle.Short, { placeholder: 'Ex: 📢 ou <:nom:id>' }),
            )
        );
    }

    // 4. Soumission des modals
    if (interaction.isModalSubmit()) {
        const config = setupCache.get(interaction.user.id);
        if (!config) return;

        if (interaction.customId === 'rr_modal_embed') {
            config.title = interaction.fields.getTextInputValue('title') || config.title;
            config.footer = interaction.fields.getTextInputValue('footer');
            config.color = validateColor(interaction.fields.getTextInputValue('color'));
            return showPreview(interaction, config, true);
        }

        if (interaction.customId.startsWith('rr_modal_role_')) {
            const roleId = interaction.customId.replace('rr_modal_role_', '');
            const role = interaction.guild.roles.cache.get(roleId);
            const label = interaction.fields.getTextInputValue('label').trim();
            const emoji = interaction.fields.getTextInputValue('emoji').trim();
            config.roles.push({
                id: roleId,
                name: role?.name || 'Rôle',
                description: interaction.fields.getTextInputValue('description'),
                label: label || role?.name || 'Rôle',
                emoji: emoji || null,
            });
            return showPreview(interaction, config, true);
        }
    }
}

module.exports = { definition, handleInteraction };