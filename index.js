/**
 * ============================================================
 *  index.js — Point d'entrée du bot H.U.N.T - UNIT
 *  H.U.N.T - UNIT Discord Bot
 * ============================================================
 *
 *  Ce fichier est minimal : il se charge uniquement de :
 *    1. Initialiser le client Discord
 *    2. Charger automatiquement toutes les commandes dans /commands
 *    3. Enregistrer les commandes slash auprès de l'API Discord
 *    4. Router les interactions vers le bon handler de commande
 *
 *  ─── Pour ajouter une nouvelle commande ───────────────────
 *  Il suffit de créer un fichier dans /commands qui exporte :
 *    - definition      : SlashCommandBuilder
 *    - handleInteraction(interaction) : async function
 *
 *  Le chargement est 100% automatique, aucune modification
 *  de ce fichier n'est nécessaire.
 *  ──────────────────────────────────────────────────────────
 */

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType,
    MessageFlags,
} = require('discord.js');

const fs   = require('node:fs');
const path = require('node:path');

// ─────────────────────────────────────────────
//  Configuration
// ─────────────────────────────────────────────

// Si GUILD_ID est défini → commandes instantanées (mode dev/prod sur un seul serveur)
// Si absent             → commandes globales (jusqu'à 1h de délai)
const GUILD_ID = process.env.GUILD_ID || null;

// ─────────────────────────────────────────────
//  Initialisation du client Discord
// ─────────────────────────────────────────────

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ─────────────────────────────────────────────
//  Chargement automatique des commandes
//  Chaque fichier dans /commands doit exporter :
//    { definition, handleInteraction }
// ─────────────────────────────────────────────

const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

/** Map : commandName → module de commande */
const commandModules = new Map();

for (const file of commandFiles) {
    const command = require(path.join(commandsDir, file));

    if (!command.definition || !command.handleInteraction) {
        console.warn(`[WARN] Le fichier commands/${file} ne respecte pas le format requis (manque definition ou handleInteraction).`);
        continue;
    }

    commandModules.set(command.definition.name, command);
    console.log(`[H.U.N.T - UNIT] Commande chargée : /${command.definition.name}`);
}

// ─────────────────────────────────────────────
//  Événement : Bot prêt
// ─────────────────────────────────────────────

client.once('ready', async () => {
    console.log(`\n[H.U.N.T - UNIT] ✅ Système en ligne. Identification : ${client.user.tag}`);
    console.log(`[H.U.N.T - UNIT] ${commandModules.size} commande(s) chargée(s).`);

    client.user.setActivity('VT22s Productions', { type: ActivityType.Watching });

    // Enregistrement des commandes Slash auprès de l'API Discord
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandsJSON = [...commandModules.values()].map(cmd => cmd.definition.toJSON());

    try {
        // ── Nettoyage unique : si GUILD_ID défini, vider les commandes guild ──
        // (supprime les commandes guild qui causaient l'absence de badge
        //  et le non-fonctionnement sur les autres serveurs)
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, GUILD_ID),
                { body: [] }
            );
            console.log(`[H.U.N.T - UNIT] 🧹 Commandes guild vidées (nettoyage serveur ${GUILD_ID}).`);
        }

        // ── Enregistrement GLOBAL : badge + tous les serveurs ─────────────────
        // Les commandes globales sont visibles partout où le bot est invité.
        // Discord applique les changements en général en quelques minutes
        // (max théorique 1h, en pratique souvent < 5min pour les serveurs actifs).
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandsJSON });
        console.log('[H.U.N.T - UNIT] ✅ Commandes globales synchronisées — badge restauré, tous serveurs actifs.\n');

    } catch (error) {
        console.error('[H.U.N.T - UNIT] ❌ Erreur de synchronisation des commandes :', error);
    }
});

// ─────────────────────────────────────────────
//  Événement : Réception d'une interaction
// ─────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
    try {
        // ── Routage par nom de commande (slash command) ──────────
        if (interaction.isChatInputCommand()) {
            const module = commandModules.get(interaction.commandName);
            if (module) {
                await module.handleInteraction(interaction);
                return;
            }
        }

        // ── Routage des interactions secondaires (boutons, modaux) ──
        // On propage l'interaction à TOUS les modules (chaque module
        // gère ses propres customIds via ses conditions internes).
        for (const [, module] of commandModules) {
            await module.handleInteraction(interaction);
        }

    } catch (error) {
        console.error('[H.U.N.T - UNIT] ❌ Erreur dans interactionCreate :', error);

        // Réponse d'erreur sécurisée — empêche le crash
        if (interaction.isRepliable()) {
            const errorMsg = {
                content: '❌ Une erreur inattendue est survenue, mais le système a évité le crash.',
                flags: MessageFlags.Ephemeral,
            };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorMsg).catch(() => false);
            } else {
                await interaction.reply(errorMsg).catch(() => false);
            }
        }
    }
});

// ─────────────────────────────────────────────
//  Connexion au bot
// ─────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
