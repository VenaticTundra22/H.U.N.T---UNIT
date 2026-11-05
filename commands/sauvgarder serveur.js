/**
 * ============================================================
 *  commands/sauvegarder serveur.js — Sauvegarde de serveur
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *  Utilise Discord Components V2 (discord.js >= 14.18)
 *
 *  Fonctionnement :
 *   - Panneau principal : "Tout sauvegarder" ou "Sauvegarde avancée"
 *   - Panneau avertissant que la fonctionnalité existe nativement sur Discord
 *   - Sauvegarde : roles, salons (+ permissions), emojis, infos serveur, bots
 *   - Résultat envoyé sous forme de fichier .json (JSON brut) en message éphémère
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
} = require('discord.js');

// ─── Constantes ───────────────────────────────────────────────────────────────

const CMD = 'sauvegarder-serveur';

const CATEGORIES = [
    { value: 'roles', label: '🎭 Roles', description: 'Nom, couleur, permissions et position de chaque role' },
    { value: 'channels', label: '📁 Salons & categories', description: 'Structure des salons, categories et permissions de salon' },
    { value: 'server_info', label: '⚙️ Infos serveur', description: 'Nom, icone, description, niveau de verification...' },
    { value: 'emojis', label: '😀 Emojis personnalises', description: 'Nom et URL de chaque emoji du serveur' },
    { value: 'bots', label: '🤖 Bots presents', description: 'Liste des bots (nom + ID) presents sur le serveur' },
];

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function buildMainPanel() {
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## 💾 Sauvegarder votre serveur')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Ligne 1 — Tout sauvegarder
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '### 📦 Tout sauvegarder\n' +
                    '-# Genere une sauvegarde complete : roles, salons,\n' +
                    '-# emojis, informations generales et bots.'
                )
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('sv_save_all')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💾')
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // Ligne 2 — Sauvegarde avancée
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '### 🔧 Sauvegarde avancee\n' +
                    '-# Choisissez precisement les elements a inclure\n' +
                    '-# dans votre sauvegarde.'
                )
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId('sv_advanced')
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
            '-# ⚠️  Cette fonctionnalite est possible nativement par Discord ⚠️'
        )
    );

    return container;
}

function buildAdvancedPanel() {
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## 🔧 Sauvegarde avancee')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            'Selectionnez les categories a inclure dans votre sauvegarde.\n' +
            '-# Vous pouvez en choisir plusieurs simultanement.'
        )
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '-# ⚠️  Cette fonctionnalite est possible nativement par Discord ⚠️'
        )
    );

    return container;
}

function buildResultPanel(data) {
    const container = new ContainerBuilder().setAccentColor(0x57F287);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ✅ Sauvegarde generee !')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const cats = Object.keys(data).filter(k => k !== 'meta');
    const catLabel = cats.length
        ? cats.map(c => CATEGORIES.find(x => x.value === c)?.label ?? c).join(', ')
        : 'aucune';
    const ts = Math.floor(new Date(data.meta.exportedAt).getTime() / 1000);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Serveur :** ${data.meta.guildName}\n` +
            `**Categories :** ${catLabel}\n` +
            `**Exporte le :** <t:${ts}:F>\n\n` +
            '> La sauvegarde est jointe en piece jointe (fichier **.json**).\n' +
            '> Conservez ce fichier pour restaurer avec `/importer-serveur`.'
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '-# ⚠️  Cette fonctionnalite est possible nativement par Discord ⚠️'
        )
    );

    return container;
}

// ─── Collecte de données ──────────────────────────────────────────────────────

async function collectData(guild, categories) {
    const data = {
        meta: {
            exportedAt: new Date().toISOString(),
            exportedBy: 'H.U.N.T - UNIT Bot',
            guildId: guild.id,
            guildName: guild.name,
        },
    };

    // Infos serveur : synchrone, pas d appel API
    if (categories.includes('server_info')) {
        data.server_info = {
            name: guild.name,
            description: guild.description ?? null,
            iconURL: guild.iconURL({ size: 512 }) ?? null,
            bannerURL: guild.bannerURL({ size: 1024 }) ?? null,
            verificationLevel: guild.verificationLevel,
            explicitContentFilter: guild.explicitContentFilter,
            defaultMessageNotifications: guild.defaultMessageNotifications,
            premiumTier: guild.premiumTier,
            memberCount: guild.memberCount,
            preferredLocale: guild.preferredLocale,
            systemChannelId: guild.systemChannelId ?? null,
            rulesChannelId: guild.rulesChannelId ?? null,
        };
    }

    // Fetches API en parallele (roles, salons, emojis)
    // guild.members.fetch() est EXCLU : sans l'intent GuildMembers il timeout apres 15s.
    // Les bots sont deja en cache car actifs sur le serveur.
    const [fetchedRoles, , fetchedEmojis] = await Promise.all([
        categories.includes('roles') ? guild.roles.fetch() : Promise.resolve(null),
        categories.includes('channels') ? guild.channels.fetch() : Promise.resolve(null),
        categories.includes('emojis') ? guild.emojis.fetch() : Promise.resolve(null),
        Promise.resolve(null), // placeholder bots (pas de fetch necessaire)
    ]);

    if (categories.includes('roles') && fetchedRoles) {
        data.roles = fetchedRoles
            .filter(r => !r.managed) // exclure uniquement les roles de bots, @everyone inclus
            .map(r => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
                hoist: r.hoist,
                mentionable: r.mentionable,
                permissions: r.permissions.toArray(),
                position: r.position,
            }))
            .sort((a, b) => b.position - a.position);
    }

    if (categories.includes('channels')) {
        data.channels = guild.channels.cache.map(ch => {
            const base = {
                id: ch.id,
                name: ch.name,
                type: ch.type,
                position: ch.rawPosition,
                parentId: ch.parentId ?? null,
                permissionOverwrites: ch.permissionOverwrites?.cache.map(ow => ({
                    id: ow.id,
                    type: ow.type,
                    allow: ow.allow.toArray(),
                    deny: ow.deny.toArray(),
                })) ?? [],
            };
            if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) {
                base.topic = ch.topic ?? null;
                base.nsfw = ch.nsfw ?? false;
                base.slowmode = ch.rateLimitPerUser ?? 0;
            }
            if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) {
                base.bitrate = ch.bitrate ?? null;
                base.userLimit = ch.userLimit ?? 0;
            }
            return base;
        });
    }

    if (categories.includes('emojis') && fetchedEmojis) {
        data.emojis = fetchedEmojis.map(e => ({
            id: e.id,
            name: e.name,
            animated: e.animated,
            url: e.imageURL(),
            available: e.available,
        }));
    }

    if (categories.includes('bots')) {
        data.bots = guild.members.cache
            .filter(m => m.user.bot)
            .map(m => ({
                id: m.user.id,
                username: m.user.username,
                tag: m.user.tag,
                joinedAt: m.joinedAt?.toISOString() ?? null,
            }));
    }

    return data;
}
async function sendResult(interaction, data) {
    const json = JSON.stringify(data, null, 2);
    const safeName = data.meta.guildName.replace(/[^a-z0-9]/gi, '_');
    const fileName = `sauvegarde_${safeName}_${Date.now()}.json`;

    // 1. Panneau résultat (Components V2)
    await interaction.editReply({
        components: [buildResultPanel(data)],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    });

    // 2. Fichier .json en followUp separé
    //    (Discord ne supporte pas les fichiers joints dans un editReply IsComponentsV2)
    await interaction.followUp({
        content: `📎 **Fichier de sauvegarde :** \`${fileName}\``,
        files: [{
            attachment: Buffer.from(json, 'utf8'),
            name: fileName,
            description: 'Sauvegarde du serveur Discord (JSON)',
        }],
        flags: MessageFlags.Ephemeral,
    });
}

// ─── Définition ───────────────────────────────────────────────────────────────

const definition = new SlashCommandBuilder()
    .setName(CMD)
    .setDescription('Sauvegarde la configuration du serveur sous forme de fichier exportable')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleInteraction(interaction) {

    // 1. Lancement de la commande
    if (interaction.isChatInputCommand() && interaction.commandName === CMD) {
        return interaction.reply({
            components: [buildMainPanel()],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
        });
    }

    // 2. Boutons
    if (interaction.isButton()) {
        const { customId } = interaction;

        // Ignorer les boutons qui n'appartiennent pas à cette commande
        if (!customId.startsWith('sv_')) return;

        // Tout sauvegarder
        if (customId === 'sv_save_all') {
            await interaction.deferUpdate();
            try {
                const data = await collectData(interaction.guild, ['server_info', 'roles', 'channels', 'emojis', 'bots']);
                await sendResult(interaction, data);
            } catch (err) {
                console.error('[sv_save_all]', err);
                await interaction.editReply({
                    components: [new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Erreur lors de la sauvegarde. Verifiez les permissions du bot.')
                    )],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                });
            }
            return;
        }

        // Ouvrir le menu avancé
        if (customId === 'sv_advanced') {
            const select = new StringSelectMenuBuilder()
                .setCustomId('sv_select_categories')
                .setPlaceholder('Selectionnez les categories a inclure...')
                .setMinValues(1)
                .setMaxValues(CATEGORIES.length)
                .addOptions(CATEGORIES.map(c =>
                    new StringSelectMenuOptionBuilder()
                        .setValue(c.value)
                        .setLabel(c.label)
                        .setDescription(c.description)
                ));

            return interaction.update({
                components: [
                    buildAdvancedPanel(),
                    new ActionRowBuilder().addComponents(select),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('sv_back_main')
                            .setLabel('← Retour')
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }

        // Retour au panneau principal
        if (customId === 'sv_back_main') {
            return interaction.update({
                components: [buildMainPanel()],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }
    }

    // 3. Sélection des catégories (sauvegarde avancée)
    if (interaction.isStringSelectMenu() && interaction.customId === 'sv_select_categories') {
        await interaction.deferUpdate();
        try {
            const data = await collectData(interaction.guild, interaction.values);
            await sendResult(interaction, data);
        } catch (err) {
            console.error('[sv_select_categories]', err);
            await interaction.editReply({
                components: [new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Erreur lors de la sauvegarde. Verifiez les permissions du bot.')
                )],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            });
        }
    }
}

// ─────────────────────────────────────────────
//  Exports — NE PAS MODIFIER
// ─────────────────────────────────────────────

module.exports = { definition, handleInteraction };
