require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ActivityType, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Système de stockage des sessions pour le constructeur multiple
const builderSessions = new Map();

// Définition de la commande Slash avec restriction de sécurité
const commands = [
    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Ouvre le terminal H.U.N.T - UNIT pour configurer un embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // SÉCURITÉ : Admin uniquement
    new SlashCommandBuilder()
        .setName('builder')
        .setDescription('Ouvre le constructeur avancé (Multi-embeds et texte)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`[H.U.N.T - UNIT] Système en ligne. Identification : ${client.user.tag}`);
    client.user.setActivity('VT22s Productions', { type: ActivityType.Watching });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('[H.U.N.T - UNIT] Commandes sécurisées synchronisées.');
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
        
        const modal = new ModalBuilder()
            .setCustomId('huntConfigMenu')
            .setTitle('Terminal H.U.N.T - UNIT');

        const titleInput = new TextInputBuilder()
            .setCustomId('title')
            .setLabel("Titre de l'embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel("Description (Markdown supporté)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel("Couleur Hexadécimale (ex: #FF0000)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const imageInput = new TextInputBuilder()
            .setCustomId('imageUrl')
            .setLabel("URL de l'image (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('footer')
            .setLabel("Texte du Footer (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'huntConfigMenu') {
        const title = interaction.fields.getTextInputValue('title');
        const desc = interaction.fields.getTextInputValue('description');
        const rawColor = interaction.fields.getTextInputValue('color');
        const color = (rawColor && /^#[0-9A-F]{6}$/i.test(rawColor)) ? rawColor : '#2b2d31';
        const imageUrl = interaction.fields.getTextInputValue('imageUrl');
        const footerText = interaction.fields.getTextInputValue('footer') || 'H.U.N.T - UNIT | Secure System';

        const customEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor(color)
            .setFooter({ text: footerText })
            .setTimestamp();

        if (imageUrl && imageUrl.startsWith('http')) {
            customEmbed.setImage(imageUrl);
        }

        await interaction.channel.send({ embeds: [customEmbed] });
        // On confirme la création à l'utilisateur de manière éphémère
        await interaction.reply({ content: '✅ Embed créé et envoyé avec succès !', ephemeral: true });
    }

        // --- GESTION DU BUILDER AVANCÉ (Façon Discohook) ---
        if (interaction.isChatInputCommand() && interaction.commandName === 'builder') {
            builderSessions.set(interaction.user.id, { content: null, embeds: [] });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('build_text').setLabel('📝 Texte').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('build_embed').setLabel('🖼️ Ajouter Embed').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('build_send').setLabel('✅ Envoyer').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('build_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger)
            );
            
            await interaction.reply({ 
                content: '### 🛠️ Terminal de Construction Avancé\nUtilisez les boutons pour composer votre message.\n\n**Statut actuel :**\n- Texte : Aucun\n- Embeds : 0/10', 
                components: [row], 
                ephemeral: true 
            });
        }

        if (interaction.isButton() && interaction.customId.startsWith('build_')) {
            const session = builderSessions.get(interaction.user.id);
            if (!session) return interaction.reply({ content: 'Session expirée. Veuillez refaire `/builder`.', ephemeral: true });

            if (interaction.customId === 'build_text') {
                const modal = new ModalBuilder().setCustomId('modal_build_text').setTitle('Texte du message');
                const textInput = new TextInputBuilder().setCustomId('content').setLabel('Contenu (non-embed)').setStyle(TextInputStyle.Paragraph).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(textInput));
                await interaction.showModal(modal);
            } else if (interaction.customId === 'build_embed') {
                if (session.embeds.length >= 10) return interaction.reply({ content: 'Limite de 10 embeds atteinte (API Discord) !', ephemeral: true });
                const modal = new ModalBuilder().setCustomId('modal_build_embed').setTitle('Nouvel Embed');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel("Titre").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel("Description").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel("Couleur Hex (ex: #FF0000)").setStyle(TextInputStyle.Short).setRequired(false))
                );
                await interaction.showModal(modal);
            } else if (interaction.customId === 'build_send') {
                if (!session.content && session.embeds.length === 0) return interaction.reply({ content: 'Le message est complètement vide !', ephemeral: true });
                await interaction.channel.send({ content: session.content || undefined, embeds: session.embeds });
                builderSessions.delete(interaction.user.id);
                await interaction.update({ content: '✅ Message publié avec succès !', components: [] });
            } else if (interaction.customId === 'build_cancel') {
                builderSessions.delete(interaction.user.id);
                await interaction.update({ content: '❌ Construction annulée.', components: [] });
            }
        }

        if (interaction.isModalSubmit() && (interaction.customId === 'modal_build_text' || interaction.customId === 'modal_build_embed')) {
            const session = builderSessions.get(interaction.user.id);
            if (!session) return interaction.reply({ content: 'Session expirée.', ephemeral: true });
            
            if (interaction.customId === 'modal_build_text') {
                session.content = interaction.fields.getTextInputValue('content');
            } else {
                const title = interaction.fields.getTextInputValue('title');
                const desc = interaction.fields.getTextInputValue('description');
                const rawColor = interaction.fields.getTextInputValue('color');
                const color = (rawColor && /^#[0-9A-F]{6}$/i.test(rawColor)) ? rawColor : '#2b2d31';
                session.embeds.push(new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color));
            }
            
            await interaction.update({ content: `### 🛠️ Terminal de Construction Avancé\nUtilisez les boutons pour composer votre message.\n\n**Statut actuel :**\n- Texte : ${session.content ? 'Défini' : 'Aucun'}\n- Embeds : ${session.embeds.length}/10`, components: interaction.message.components });
        }
    } catch (error) {
        console.error('Erreur attrapée dans interactionCreate :', error);
        if (interaction.isRepliable()) {
            const msg = { content: '❌ Une erreur inattendue est survenue, mais le système a empêché le crash.', ephemeral: true };
            if (interaction.deferred || interaction.replied) await interaction.followUp(msg).catch(() => false);
            else await interaction.reply(msg).catch(() => false);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
