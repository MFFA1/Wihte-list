const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`✅ Bot ist online als ${client.user.tag}`);
        
        // Status setzen
        client.user.setActivity('Whitelist System', { type: ActivityType.Watching });

        // Sende Whitelist-Nachricht im konfigurierten Channel
        const whitelistChannelId = process.env.WHITELIST_CHANNEL_ID;
        if (!whitelistChannelId) {
            console.log('⚠️  WHITELIST_CHANNEL_ID nicht in .env gefunden!');
            return;
        }

        try {
            const channel = await client.channels.fetch(whitelistChannelId);
            
            if (!channel) {
                console.log('⚠️  Whitelist-Channel nicht gefunden!');
                return;
            }

            // Lösche alte Bot-Nachrichten im Channel
            const messages = await channel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);
            await channel.bulkDelete(botMessages).catch(() => {});

            // Lade Whitelist für Counter
            const whitelistPath = path.join(__dirname, '..', 'whitelist.json');
            let whitelistCount = 0;
            if (fs.existsSync(whitelistPath)) {
                const data = fs.readFileSync(whitelistPath, 'utf8');
                const whitelist = JSON.parse(data);
                whitelistCount = whitelist.length;
            }

            // Erstelle Embed
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎮 Minecraft Whitelist')
                .setDescription('Klicke auf den Button unten, um dich zur Whitelist hinzuzufügen!')
                .addFields(
                    { name: '📋 Anleitung', value: 'Klicke auf **"Zur Whitelist hinzufügen"** und gib deinen Minecraft-Namen ein.' },
                    { name: '✅ Vorteile', value: '• Automatische UUID-Abfrage\n• Sofortige Bestätigung\n• Schutz vor Doppeleinträgen' },
                    { name: '📊 Spieler auf der Whitelist', value: `\`${whitelistCount}\``, inline: true }
                )
                .setFooter({ text: 'MFFA Server Whitelist System' })
                .setTimestamp();

            // Erstelle Button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('whitelist_add')
                        .setLabel('Zur Whitelist hinzufügen')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅')
                );

            // Sende Nachricht
            await channel.send({ embeds: [embed], components: [row] });
            console.log('✅ Whitelist-Nachricht gesendet!');

        } catch (error) {
            console.error('❌ Fehler beim Senden der Whitelist-Nachricht:', error);
        }
    }
};
