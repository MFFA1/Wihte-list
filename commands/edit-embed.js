const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-embed')
        .setDescription('Bearbeite das Whitelist-Embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Nur für Admins
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ Du hast keine Berechtigung, diesen Command zu verwenden!', 
                ephemeral: true 
            });
        }

        // Erstelle Modal mit dem /edit-embed-modal Custom ID
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('edit_embed_modal')
            .setTitle('Whitelist-Embed bearbeiten');

        // Titel Input
        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Embed Titel')
            .setPlaceholder('z.B. 🎮 Minecraft Whitelist')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Beschreibung Input
        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('Embed Beschreibung')
            .setPlaceholder('Klicke auf den Button...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // Anleitung Input
        const instructionInput = new TextInputBuilder()
            .setCustomId('embed_instruction')
            .setLabel('Informations Text')
            .setPlaceholder('Klicke auf "Zur Whitelist hinzufügen"...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // Vorteile Input
        const advantagesInput = new TextInputBuilder()
            .setCustomId('embed_advantages')
            .setLabel('Vorteile Text')
            .setPlaceholder('• Punkt 1\n• Punkt 2...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        // Füge die Inputs zu ActionRows hinzu
        const row1 = new ActionRowBuilder().addComponents(titleInput);
        const row2 = new ActionRowBuilder().addComponents(descriptionInput);
        const row3 = new ActionRowBuilder().addComponents(instructionInput);
        const row4 = new ActionRowBuilder().addComponents(advantagesInput);

        modal.addComponents(row1, row2, row3, row4);

        await interaction.showModal(modal);
    }
};
