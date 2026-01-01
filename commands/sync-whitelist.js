const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendWhitelistToServer } = require('../utils/rconHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync-whitelist')
        .setDescription('Synchronisiert die Bot-Whitelist mit dem Minecraft-Server via RCON')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const whitelistPath = path.join(__dirname, '..', 'whitelist.json');

        try {
            // Lade whitelist.json
            if (!fs.existsSync(whitelistPath)) {
                return interaction.editReply({
                    content: '❌ Keine Whitelist-Datei gefunden!',
                });
            }

            const data = fs.readFileSync(whitelistPath, 'utf8');
            const whitelist = JSON.parse(data);

            if (whitelist.length === 0) {
                return interaction.editReply({
                    content: '⚠️ Die Whitelist ist leer!',
                });
            }

            // Status-Nachricht
            await interaction.editReply({
                content: `🔄 Synchronisiere ${whitelist.length} Spieler zum Server...`,
            });

            // Sende Whitelist zum Server
            const result = await sendWhitelistToServer(whitelist);

            // Erfolgs-Embed
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Whitelist erfolgreich synchronisiert')
                .setDescription(`Die Whitelist wurde erfolgreich mit dem Minecraft-Server synchronisiert.`)
                .addFields(
                    { name: '📊 Anzahl Spieler', value: `${result.count}`, inline: true },
                    { name: '🕐 Zeitpunkt', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `Synchronisiert von ${interaction.user.tag}` });

            await interaction.editReply({
                content: null,
                embeds: [successEmbed],
            });

            console.log(`✅ Whitelist synchronisiert: ${result.count} Spieler`);

        } catch (error) {
            console.error('Fehler beim Synchronisieren:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Synchronisation fehlgeschlagen')
                .setDescription('Die Whitelist konnte nicht mit dem Server synchronisiert werden.')
                .addFields(
                    { name: '📋 Fehler', value: `\`\`\`${error.message}\`\`\``, inline: false }
                )
                .setTimestamp();

            // Prüfe ob RCON-Konfiguration fehlt
            if (error.message.includes('RCON-Konfiguration fehlt')) {
                errorEmbed.addFields({
                    name: '💡 Lösung',
                    value: 'Stelle sicher, dass `RCON_HOST`, `RCON_PORT` und `RCON_PASSWORD` in der `.env` Datei konfiguriert sind.',
                    inline: false
                });
            }

            return interaction.editReply({
                content: null,
                embeds: [errorEmbed],
            });
        }
    },
};
