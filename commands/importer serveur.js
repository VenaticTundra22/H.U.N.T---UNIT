/**
 * ============================================================
 *  commands/importer serveur.js — Importation de serveur
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *  Utilise Discord Components V2 (discord.js >= 14.18)
 *
 *  Fonctionnement :
 *   - L'utilisateur fournit le fichier .json généré par /sauvegarder-serveur
 *   - Le bot lit le JSON, affiche un récapitulatif des données détectées
 *   - L'admin choisit ce qu'il veut restaurer via un menu avancé
 *   - Une confirmation est demandée avant toute action destructive
 *   - Avertissement que la fonctionnalité existe nativement sur Discord
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    OverwriteType,
} = require('discord.js');

// ─── Constantes ───────────────────────────────────────────────────────────────

const CMD = 'importer-serveur';

// Cache temporaire : userId → { data, selected }
const importCache = new Map();

const RESTORABLE = [
    { value: 'server_info', label: '⚙️ Infos serveur', description: 'Nom, icone, description, niveau de verification...' },
    { value: 'roles', label: '🎭 Roles', description: 'Recree les roles (couleur, perms, position)' },
    { value: 'channels', label: '📁 Salons & categories', description: 'Recree les salons avec leurs permissions' },
    { value: 'emojis', label: '😀 Emojis personnalises', description: 'Reimporte les emojis depuis leur URL' },
];

// ─── Helpers UI ───────────────────────────────────────────────────────────────

/** Panneau de récapitulatif après lecture du fichier. */
function buildSummaryPanel(data) {
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## 📥 Importer une sauvegarde')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const ts = Math.floor(new Date(data.meta.exportedAt).getTime() / 1000);
    const cats = Object.keys(data).filter(k => k !== 'meta');
    const lines = cats.map(c => {
        const found = RESTORABLE.find(r => r.value === c);
        const count = Array.isArray(data[c]) ? ` (${data[c].length})` : '';
        return `• ${found?.label ?? c}${count}`;
    }).join('\n');

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Sauvegarde de :** ${data.meta.guildName}\n` +
            `**Exportée le :** <t:${ts}:F>\n` +
            `**Exportée par :** ${data.meta.exportedBy}\n\n` +
            `**Données disponibles :**\n${lines}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // Ligne — Tout restaurer
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '### ♻️ Tout restaurer\n' +
                    '-# Applique toutes les données disponibles\n' +
                    '-# dans la sauvegarde sur ce serveur.'
                )
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('imp_restore_all')
                    .setLabel('Tout restaurer')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('♻️')
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // Ligne — Restauration avancée
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '### 🔧 Restauration avancée\n' +
                    '-# Choisissez précisément les éléments\n' +
                    '-# à restaurer sur ce serveur.'
                )
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('imp_advanced')
                    .setLabel('Choisir')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔧')
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# ⚠️  Cette fonctionnalité est possible nativement par Discord ⚠️"
        )
    );

    return container;
}

/** Panneau de confirmation avant restauration. */
function buildConfirmPanel(categories, data) {
    const container = new ContainerBuilder().setAccentColor(0xFEE75C);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ⚠️ Confirmer la restauration')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const lines = categories.map(c => {
        const found = RESTORABLE.find(r => r.value === c);
        const count = Array.isArray(data[c]) ? ` (${data[c].length} éléments)` : '';
        return `• ${found?.label ?? c}${count}`;
    }).join('\n');

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '> **Cette action est irréversible.**\n' +
            '> Les éléments existants peuvent être modifiés ou supprimés.\n\n' +
            `**Éléments à restaurer :**\n${lines}\n\n` +
            '**Confirmez-vous la restauration ?**'
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# ⚠️  Cette fonctionnalité est possible nativement par Discord ⚠️"
        )
    );

    return container;
}

/** Panneau de résultat après restauration. */
function buildResultPanel(results) {
    const hasErrors = results.some(r => r.status === 'error');
    const color = hasErrors ? 0xED4245 : 0x57F287;
    const title = hasErrors ? '## ⚠️ Restauration terminée avec erreurs' : '## ✅ Restauration terminée !';

    const container = new ContainerBuilder().setAccentColor(color);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(title)
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const lines = results.map(r => {
        const icon = r.status === 'ok' ? '✅' : r.status === 'skipped' ? '⏭️' : '❌';
        return `${icon} **${r.label}** — ${r.message}`;
    }).join('\n');

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# ⚠️  Cette fonctionnalité est possible nativement par Discord ⚠️"
        )
    );

    return container;
}

// ─── Restauration ─────────────────────────────────────────────────────────────

async function restoreServerInfo(guild, info) {
    try {
        const opts = { reason: '[H.U.N.T] Restauration via /importer-serveur' };
        if (info.name) opts.name = info.name;
        if (info.description !== undefined) opts.description = info.description;
        if (info.verificationLevel !== undefined) opts.verificationLevel = info.verificationLevel;
        if (info.explicitContentFilter !== undefined) opts.explicitContentFilter = info.explicitContentFilter;
        if (info.defaultMessageNotifications !== undefined) opts.defaultMessageNotifications = info.defaultMessageNotifications;
        if (info.preferredLocale) opts.preferredLocale = info.preferredLocale;

        await guild.edit(opts);
        return { label: '⚙️ Infos serveur', status: 'ok', message: 'Paramètres du serveur mis à jour.' };
    } catch (e) {
        return { label: '⚙️ Infos serveur', status: 'error', message: e.message };
    }
}

async function restoreRoles(guild, roles) {
    let created = 0, updated = 0, failed = 0;
    const roleMap = new Map();

    // Trier du PLUS HAUT au PLUS BAS : Discord place chaque nouveau role
    // en position 1 (juste au-dessus de @everyone), ce qui pousse les
    // precedents vers le haut. En creant du plus haut au plus bas,
    // le dernier cree (plus bas) reste en bas -> ordre final correct.
    const sorted = [...roles].sort((a, b) => b.position - a.position);

    for (const r of sorted) {
        try {
            // @everyone existe sur tout serveur : edition, pas creation
            if (r.name === '@everyone') {
                await guild.roles.edit(guild.roles.everyone, {
                    permissions: r.permissions,
                    reason: '[H.U.N.T] Restauration via /importer-serveur',
                });
                roleMap.set(r.id, guild.roles.everyone.id);
                updated++;
                continue;
            }

            const newRole = await guild.roles.create({
                name: r.name,
                color: r.color ?? null,
                hoist: r.hoist,
                mentionable: r.mentionable,
                permissions: r.permissions,
                reason: '[H.U.N.T] Restauration via /importer-serveur',
            });
            roleMap.set(r.id, newRole.id);
            created++;
        } catch (err) {
            console.warn('[imp] Echec creation role', r.name, ':', err.message);
            failed++;
        }
    }

    const result = failed === 0
        ? { label: 'Roles', status: 'ok', message: created + ' cree(s), ' + updated + ' mis a jour (@everyone).' }
        : { label: 'Roles', status: 'error', message: (created + updated) + ' traite(s), ' + failed + ' echec(s).' };

    result.roleMap = roleMap;
    return result;
}

async function restoreChannels(guild, channels, roleMap) {
    let created = 0, failed = 0;

    // 1. Créer les catégories en premier
    const categories = channels.filter(ch => ch.type === ChannelType.GuildCategory);
    const catMap = new Map();

    for (const cat of categories.sort((a, b) => a.position - b.position)) {
        try {
            const newCat = await guild.channels.create({
                name: cat.name,
                type: ChannelType.GuildCategory,
                position: cat.position,
                permissionOverwrites: buildOverwrites(cat.permissionOverwrites, roleMap),
                reason: '[H.U.N.T] Restauration via /importer-serveur',
            });
            catMap.set(cat.id, newCat.id);
            created++;
        } catch { failed++; }
    }

    // 2. Créer les salons enfants
    const others = channels.filter(ch => ch.type !== ChannelType.GuildCategory);
    for (const ch of others.sort((a, b) => a.position - b.position)) {
        try {
            const opts = {
                name: ch.name,
                type: ch.type,
                position: ch.position,
                parent: ch.parentId ? (catMap.get(ch.parentId) ?? null) : null,
                permissionOverwrites: buildOverwrites(ch.permissionOverwrites, roleMap),
                reason: '[H.U.N.T] Restauration via /importer-serveur',
            };
            if (ch.topic) opts.topic = ch.topic;
            if (ch.nsfw) opts.nsfw = ch.nsfw;
            if (ch.slowmode) opts.rateLimitPerUser = ch.slowmode;
            if (ch.bitrate) opts.bitrate = ch.bitrate;
            if (ch.userLimit) opts.userLimit = ch.userLimit;

            await guild.channels.create(opts);
            created++;
        } catch { failed++; }
    }

    if (failed === 0) return { label: '📁 Salons & catégories', status: 'ok', message: `${created} salon(s) créé(s).` };
    return { label: '📁 Salons & catégories', status: 'error', message: `${created} créé(s), ${failed} échec(s).` };
}

/** Reconstruit les permission overwrites en remappant les anciens IDs de rôles si possible. */
function buildOverwrites(overwrites, roleMap) {
    if (!overwrites || !overwrites.length) return [];
    return overwrites.map(ow => ({
        id: roleMap?.get(ow.id) ?? ow.id,
        type: ow.type,
        allow: ow.allow,
        deny: ow.deny,
    }));
}

async function restoreEmojis(guild, emojis) {
    let created = 0, failed = 0;
    for (const e of emojis) {
        try {
            await guild.emojis.create({
                attachment: e.url,
                name: e.name,
                reason: '[H.U.N.T] Restauration via /importer-serveur',
            });
            created++;
        } catch { failed++; }
    }
    if (failed === 0) return { label: '😀 Emojis', status: 'ok', message: `${created} emoji(s) importé(s).` };
    return { label: '😀 Emojis', status: 'error', message: `${created} importé(s), ${failed} échec(s) (limite ou URL invalide).` };
}

/**
 * Orchestre la restauration des catégories demandées.
 * @returns {Array<{label, status, message}>}
 */
async function runRestore(guild, data, categories) {
    const results = [];
    let roleMap = new Map();

    if (categories.includes('server_info') && data.server_info) {
        results.push(await restoreServerInfo(guild, data.server_info));
    } else if (categories.includes('server_info')) {
        results.push({ label: '⚙️ Infos serveur', status: 'skipped', message: 'Absent de la sauvegarde.' });
    }

    // Les roles sont crees en premier pour avoir le roleMap avant les salons
    if (categories.includes('roles') && data.roles) {
        const roleResult = await restoreRoles(guild, data.roles);
        roleMap = roleResult.roleMap ?? new Map();
        delete roleResult.roleMap;
        results.push(roleResult);
    } else if (categories.includes('roles')) {
        results.push({ label: '🎭 Roles', status: 'skipped', message: 'Absent de la sauvegarde.' });
    }

    if (categories.includes('channels') && data.channels) {
        // On passe le roleMap pour remapper les anciens IDs de roles dans les permissions
        results.push(await restoreChannels(guild, data.channels, roleMap));
    } else if (categories.includes('channels')) {
        results.push({ label: '📁 Salons & categories', status: 'skipped', message: 'Absent de la sauvegarde.' });
    }

    if (categories.includes('emojis') && data.emojis) {
        results.push(await restoreEmojis(guild, data.emojis));
    } else if (categories.includes('emojis')) {
        results.push({ label: '😀 Emojis', status: 'skipped', message: 'Absent de la sauvegarde.' });
    }

    return results;
}

// ─── Définition ───────────────────────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName(CMD)
    .setDescription('Importe une sauvegarde de serveur générée par /sauvegarder-serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addAttachmentOption(opt =>
        opt.setName('fichier')
            .setDescription('Fichier .json généré par /sauvegarder-serveur')
            .setRequired(true)
    );

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleInteraction(interaction) {

    // 1. Commande slash : lire et décoder le fichier
    if (interaction.isChatInputCommand() && interaction.commandName === CMD) {
        const attachment = interaction.options.getAttachment('fichier');

        if (!attachment.name.endsWith('.json')) {
            return interaction.reply({
                content: '❌ Le fichier doit être un `.json` généré par `/sauvegarder-serveur`.',
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Télécharger et lire le fichier JSON directement
            const res = await fetch(attachment.url);
            const raw = await res.text();
            const data = JSON.parse(raw.trim());

            if (!data.meta?.guildId) throw new Error('Format de fichier invalide.');

            // Stocker en cache
            importCache.set(interaction.user.id, {
                data,
                selected: Object.keys(data).filter(k => k !== 'meta'),
            });

            await interaction.editReply({
                components: [buildSummaryPanel(data)],
                flags: [MessageFlags.IsComponentsV2],
            });
        } catch (err) {
            console.error('[imp_load]', err);
            await interaction.editReply({
                components: [
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `❌ Impossible de lire le fichier.\n-# ${err.message}`
                        )
                    )
                ],
                flags: [MessageFlags.IsComponentsV2],
            });
        }
        return;
    }

    // 2. Boutons
    if (interaction.isButton()) {
        const { customId } = interaction;

        // Ignorer les boutons qui n'appartiennent pas à cette commande
        if (!customId.startsWith('imp_')) return;

        const cache = importCache.get(interaction.user.id);

        if (!cache) {
            return interaction.reply({ content: '❌ Session expirée. Relancez `/importer-serveur`.', ephemeral: true });
        }

        // ── Tout restaurer → confirmation ──
        if (customId === 'imp_restore_all') {
            const allCats = Object.keys(cache.data).filter(k => k !== 'meta');
            cache.selected = allCats;
            return interaction.update({
                components: [
                    buildConfirmPanel(allCats, cache.data),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('imp_confirm').setLabel('✅ Confirmer').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('imp_back').setLabel('← Annuler').setStyle(ButtonStyle.Secondary),
                    ),
                ],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        // ── Sauvegarde avancée → menu de sélection ──
        if (customId === 'imp_advanced') {
            const availableCats = Object.keys(cache.data).filter(k => k !== 'meta');
            const options = RESTORABLE
                .filter(r => availableCats.includes(r.value))
                .map(r =>
                    new StringSelectMenuOptionBuilder()
                        .setValue(r.value)
                        .setLabel(r.label)
                        .setDescription(r.description)
                );

            const select = new StringSelectMenuBuilder()
                .setCustomId('imp_select_categories')
                .setPlaceholder('Sélectionnez les éléments à restaurer…')
                .setMinValues(1)
                .setMaxValues(options.length)
                .addOptions(options);

            return interaction.update({
                components: [
                    buildSummaryPanel(cache.data),
                    new ActionRowBuilder().addComponents(select),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('imp_back').setLabel('← Retour').setStyle(ButtonStyle.Secondary)
                    ),
                ],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        // ── Retour au récapitulatif ──
        if (customId === 'imp_back') {
            return interaction.update({
                components: [buildSummaryPanel(cache.data)],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        // ── Confirmation de la restauration ──
        if (customId === 'imp_confirm') {
            await interaction.deferUpdate();
            try {
                const results = await runRestore(interaction.guild, cache.data, cache.selected);
                importCache.delete(interaction.user.id);
                await interaction.editReply({
                    components: [buildResultPanel(results)],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                });
            } catch (err) {
                console.error('[imp_confirm]', err);
                await interaction.editReply({
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ Erreur inattendue lors de la restauration.')
                        )
                    ],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                });
            }
        }
    }

    // 3. Sélection avancée → confirmation
    if (interaction.isStringSelectMenu() && interaction.customId === 'imp_select_categories') {
        const cache = importCache.get(interaction.user.id);
        if (!cache) return;

        cache.selected = interaction.values;

        return interaction.update({
            components: [
                buildConfirmPanel(cache.selected, cache.data),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('imp_confirm').setLabel('✅ Confirmer').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('imp_back').setLabel('← Annuler').setStyle(ButtonStyle.Secondary),
                ),
            ],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
        });
    }
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = { definition, handleInteraction };
