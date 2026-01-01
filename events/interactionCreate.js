const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Slash Command Interaktion
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const reply = { content: 'Es gab einen Fehler beim Ausführen dieses Commands!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }

        // Button-Interaktion
        if (interaction.isButton()) {
            if (interaction.customId === 'whitelist_add') {
                // Erstelle Modal
                const modal = new ModalBuilder()
                    .setCustomId('whitelist_modal')
                    .setTitle('Zur Whitelist hinzufügen');

                // Erstelle Textfeld für Minecraft-Namen
                const minecraftNameInput = new TextInputBuilder()
                    .setCustomId('minecraft_name')
                    .setLabel('Dein Minecraft-Name')
                    .setPlaceholder('z.B. Steve oder Alex')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(16);

                const row = new ActionRowBuilder().addComponents(minecraftNameInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }

            // Whitelist-Anfrage akzeptieren
            if (interaction.customId.startsWith('whitelist_accept:')) {
                const [, userId, minecraftName] = interaction.customId.split(':');
                await interaction.deferReply({ ephemeral: true });

                const whitelistPath = path.join(__dirname, '..', 'whitelist.json');

                try {
                    // Lade whitelist.json
                    let whitelist = [];
                    if (fs.existsSync(whitelistPath)) {
                        const data = fs.readFileSync(whitelistPath, 'utf8');
                        whitelist = JSON.parse(data);
                    }

                    // Hole UUID von Mojang API
                    const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${minecraftName}`);

                    if (!response.data || !response.data.id) {
                        return interaction.editReply({
                            content: '❌ Minecraft-Spieler nicht gefunden!',
                        });
                    }

                    const uuid = response.data.id;
                    const correctName = response.data.name;
                    const formattedUUID = uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

                    // Prüfe auf Duplikate
                    if (whitelist.find(entry => entry.uuid === formattedUUID)) {
                        return interaction.editReply({
                            content: '⚠️ Dieser Minecraft-Account ist bereits auf der Whitelist!',
                        });
                    }

                    // Füge zur Whitelist hinzu
                    whitelist.push({
                        uuid: formattedUUID,
                        name: correctName,
                        discordId: userId,
                        addedAt: new Date().toISOString(),
                        addedBy: interaction.user.id
                    });

                    fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));

                    // Update Original-Nachricht
                    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#00ff00')
                        .setTitle('✅ Whitelist-Anfrage Akzeptiert')
                        .addFields({ name: '👤 Bearbeitet von', value: `${interaction.user}`, inline: true });

                    await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

                    // Benachrichtige User
                    try {
                        const user = await client.users.fetch(userId);
                        await user.send(`✅ Deine Whitelist-Anfrage für **${correctName}** wurde akzeptiert! Du kannst jetzt auf dem Server spielen.`);
                    } catch (error) {
                        console.log('Konnte User nicht benachrichtigen:', error);
                    }

                    await interaction.editReply({
                        content: `✅ **${correctName}** wurde zur Whitelist hinzugefügt!`,
                    });

                } catch (error) {
                    console.error('Fehler beim Akzeptieren:', error);
                    return interaction.editReply({
                        content: '❌ Fehler beim Hinzufügen zur Whitelist.',
                    });
                }
            }

            // Whitelist-Anfrage ablehnen
            if (interaction.customId.startsWith('whitelist_deny:')) {
                const [, userId, minecraftName] = interaction.customId.split(':');
                await interaction.deferReply({ ephemeral: true });

                try {
                    // Update Original-Nachricht
                    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#ff0000')
                        .setTitle('❌ Whitelist-Anfrage Abgelehnt')
                        .addFields({ name: '👤 Bearbeitet von', value: `${interaction.user}`, inline: true });

                    await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

                    // Benachrichtige User
                    try {
                        const user = await client.users.fetch(userId);
                        await user.send(`❌ Deine Whitelist-Anfrage für **${minecraftName}** wurde leider abgelehnt.`);
                    } catch (error) {
                        console.log('Konnte User nicht benachrichtigen:', error);
                    }

                    await interaction.editReply({
                        content: `❌ Anfrage für **${minecraftName}** wurde abgelehnt.`,
                    });

                } catch (error) {
                    console.error('Fehler beim Ablehnen:', error);
                    return interaction.editReply({
                        content: '❌ Fehler beim Ablehnen der Anfrage.',
                    });
                }
            }

            // Manuelle Whitelist-Anfrage
            if (interaction.customId.startsWith('whitelist_manual_request:')) {
                const requestChannelId = interaction.customId.split(':')[1];
                
                const modal = new ModalBuilder()
                    .setCustomId(`whitelist_manual_modal:${requestChannelId}`)
                    .setTitle('Whitelist-Anfrage stellen');

                const minecraftNameInput = new TextInputBuilder()
                    .setCustomId('minecraft_name')
                    .setLabel('Dein Minecraft-Name')
                    .setPlaceholder('z.B. Steve oder Alex')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(16);

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Warum möchtest du beitreten? (optional)')
                    .setPlaceholder('Ein paar Worte über dich...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                const row1 = new ActionRowBuilder().addComponents(minecraftNameInput);
                const row2 = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(row1, row2);

                await interaction.showModal(modal);
            }
        }

        // Modal-Submit Interaktion
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'whitelist_modal') {
                await interaction.deferReply({ ephemeral: true });

                const minecraftName = interaction.fields.getTextInputValue('minecraft_name').trim();

                // Validiere Minecraft-Namen
                if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraftName)) {
                    return interaction.editReply({
                        content: '❌ Ungültiger Minecraft-Name! Der Name muss 3-16 Zeichen lang sein und darf nur Buchstaben, Zahlen und Unterstriche enthalten.',
                    });
                }

                const whitelistPath = path.join(__dirname, '..', 'whitelist.json');

                try {
                    // Lade oder erstelle whitelist.json
                    let whitelist = [];
                    if (fs.existsSync(whitelistPath)) {
                        const data = fs.readFileSync(whitelistPath, 'utf8');
                        whitelist = JSON.parse(data);
                    }

                    // Prüfe, ob der Discord-Nutzer bereits eingetragen ist
                    const existingEntry = whitelist.find(entry => entry.discordId === interaction.user.id);
                    if (existingEntry) {
                        return interaction.editReply({
                            content: `⚠️ Du bist bereits in der Whitelist eingetragen mit dem Minecraft-Account: **${existingEntry.name}**`,
                        });
                    }

                    // Hole UUID von Mojang API
                    const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${minecraftName}`);

                    if (!response.data || !response.data.id) {
                        return interaction.editReply({
                            content: '❌ Minecraft-Spieler nicht gefunden! Bitte überprüfe den Namen.',
                        });
                    }

                    const uuid = response.data.id;
                    const correctName = response.data.name;

                    // Formatiere UUID mit Bindestrichen
                    const formattedUUID = uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

                    // Prüfe, ob dieser Minecraft-Account bereits eingetragen ist
                    const existingMinecraft = whitelist.find(entry => entry.uuid === formattedUUID);
                    if (existingMinecraft) {
                        return interaction.editReply({
                            content: `⚠️ Dieser Minecraft-Account ist bereits von einem anderen Discord-Nutzer registriert!`,
                        });
                    }

                    // Füge neuen Eintrag hinzu
                    whitelist.push({
                        uuid: formattedUUID,
                        name: correctName,
                        discordId: interaction.user.id,
                        discordTag: interaction.user.tag,
                        addedAt: new Date().toISOString()
                    });

                    // Speichere whitelist.json
                    fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));

                    // Erfolgreiche Antwort
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Erfolgreich zur Whitelist hinzugefügt!')
                        .addFields(
                            { name: '👤 Minecraft-Name', value: `\`${correctName}\``, inline: true },
                            { name: '🆔 UUID', value: `\`${formattedUUID}\``, inline: false }
                        )
                        .setFooter({ text: 'Du kannst jetzt auf dem Server spielen!' })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [successEmbed] });

                } catch (error) {
                    console.error('Fehler beim Hinzufügen zur Whitelist:', error);

                    if (error.response && error.response.status === 404) {
                        return interaction.editReply({
                            content: '❌ Minecraft-Spieler nicht gefunden! Bitte überprüfe den Namen.',
                        });
                    }

                    return interaction.editReply({
                        content: '❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
                    });
                }
            }

            // Manuelle Whitelist-Anfrage Modal
            if (interaction.customId.startsWith('whitelist_manual_modal:')) {
                await interaction.deferReply({ ephemeral: true });

                const requestChannelId = interaction.customId.split(':')[1];
                const minecraftName = interaction.fields.getTextInputValue('minecraft_name').trim();
                const reason = interaction.fields.getTextInputValue('reason')?.trim() || 'Keine Angabe';

                // Validiere Minecraft-Namen
                if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraftName)) {
                    return interaction.editReply({
                        content: '❌ Ungültiger Minecraft-Name! Der Name muss 3-16 Zeichen lang sein und darf nur Buchstaben, Zahlen und Unterstriche enthalten.',
                    });
                }

                try {
                    const requestChannel = await client.channels.fetch(requestChannelId);
                    
                    const requestEmbed = new EmbedBuilder()
                        .setColor('#ffa500')
                        .setTitle('📝 Neue Whitelist-Anfrage')
                        .setDescription(`**Benutzer:** ${interaction.user} (${interaction.user.tag})`)
                        .addFields(
                            { name: '🎮 Minecraft-Name', value: `\`${minecraftName}\``, inline: true },
                            { name: '📅 Datum', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                            { name: '💬 Begründung', value: reason, inline: false }
                        )
                        .setFooter({ text: `Discord ID: ${interaction.user.id}` })
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`whitelist_accept:${interaction.user.id}:${minecraftName}`)
                                .setLabel('Akzeptieren')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('✅'),
                            new ButtonBuilder()
                                .setCustomId(`whitelist_deny:${interaction.user.id}:${minecraftName}`)
                                .setLabel('Ablehnen')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('❌')
                        );

                    await requestChannel.send({ embeds: [requestEmbed], components: [actionRow] });

                    await interaction.editReply({
                        content: '✅ Deine Whitelist-Anfrage wurde erfolgreich an die Admins weitergeleitet! Du wirst benachrichtigt, sobald deine Anfrage bearbeitet wurde.',
                    });

                } catch (error) {
                    console.error('Fehler beim Senden der Anfrage:', error);
                    return interaction.editReply({
                        content: '❌ Ein Fehler ist beim Senden deiner Anfrage aufgetreten.',
                    });
                }
            }

            // Edit Embed Modal
            if (interaction.customId === 'edit_embed_modal') {
                await interaction.deferReply({ ephemeral: true });

                const title = interaction.fields.getTextInputValue('embed_title');
                const description = interaction.fields.getTextInputValue('embed_description');
                const instruction = interaction.fields.getTextInputValue('embed_instruction');
                const advantages = interaction.fields.getTextInputValue('embed_advantages');

                const whitelistChannelId = process.env.WHITELIST_CHANNEL_ID;
                
                if (!whitelistChannelId) {
                    return interaction.editReply({
                        content: '❌ WHITELIST_CHANNEL_ID nicht in .env gefunden!',
                    });
                }

                try {
                    const channel = await client.channels.fetch(whitelistChannelId);
                    
                    if (!channel) {
                        return interaction.editReply({
                            content: '❌ Whitelist-Channel nicht gefunden!',
                        });
                    }

                    // Lösche alte Bot-Nachrichten
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

                    // Erstelle neues Embed mit den benutzerdefinierten Werten
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle(title)
                        .setDescription(description)
                        .addFields(
                            { name: '📋 Anleitung', value: instruction },
                            { name: '✅ Vorteile', value: advantages },
                            { name: '📊 Spieler auf der Whitelist', value: `\`${whitelistCount}\``, inline: true }
                        )
                        .setFooter({ text: 'MFFA Server Whitelist System' })
                        .setTimestamp();

                    // Sende neue Nachricht ohne Button (Anmeldungen deaktiviert)
                    await channel.send({ embeds: [embed] });
                    
                    await interaction.editReply({
                        content: '✅ Das Whitelist-Embed wurde erfolgreich aktualisiert!',
                    });

                } catch (error) {
                    console.error('Fehler beim Aktualisieren des Embeds:', error);
                    return interaction.editReply({
                        content: '❌ Ein Fehler ist beim Aktualisieren des Embeds aufgetreten.',
                    });
                }
            }
        }
    }
};
