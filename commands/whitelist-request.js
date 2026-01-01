const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist-request')
        .setDescription('Richte einen Whitelist-Anfrage Channel ein')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('anfrage-channel')
                .setDescription('Channel für Whitelist-Anfragen')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('request-channel')
                .setDescription('Channel wo Anfragen gepostet werden')
                .setRequired(true)),
    
    async execute(interaction) {
        const anfrageChannel = interaction.options.getChannel('anfrage-channel');
        const requestChannel = interaction.options.getChannel('request-channel');

        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('🎮 Whitelist Anfrage')
            .setDescription('Das Whitelist-System wurde vorübergehend auf manuelle Anfragen umgestellt.')
            .addFields(
                { name: '📝 So funktioniert es', value: 'Klicke auf den Button unten, um eine Whitelist-Anfrage zu stellen. Deine Anfrage wird an die Admins weitergeleitet.' },
                { name: '⏰ Bearbeitungszeit', value: 'Anfragen werden so schnell wie möglich bearbeitet.' }
            )
            .setFooter({ text: 'MFFA Server Whitelist System' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`whitelist_manual_request:${requestChannel.id}`)
                    .setLabel('Anfrage stellen')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝')
            );

        try {
            await anfrageChannel.send({ embeds: [embed], components: [row] });
            
            await interaction.reply({
                content: `✅ Whitelist-Anfrage System eingerichtet!\n📥 Anfrage-Channel: ${anfrageChannel}\n📤 Requests gehen an: ${requestChannel}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Fehler beim Einrichten:', error);
            await interaction.reply({
                content: '❌ Fehler beim Einrichten des Anfrage-Systems.',
                ephemeral: true
            });
        }
    }
};
