const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Prüfen, ob die Nachricht im Whitelist-Kanal ist
        if (message.channel.id !== process.env.WHITELIST_CHANNEL_ID) return;
        
        // Lösche alle Nachrichten die nicht vom Bot sind
        await message.delete().catch(() => {});
    }
};
