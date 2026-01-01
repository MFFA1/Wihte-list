require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Lade alle Command-Dateien aus dem commands Ordner
const commandsPath = path.join(__dirname, 'commands');

// Prüfe ob commands Ordner existiert
if (!fs.existsSync(commandsPath)) {
    console.log('⚠️  Kein commands Ordner gefunden. Erstelle Ordner...');
    fs.mkdirSync(commandsPath);
    console.log('✅ commands Ordner erstellt.');
    console.log('ℹ️  Füge .js Dateien mit Slash Commands im commands/ Ordner hinzu.');
    process.exit(0);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
    console.log('⚠️  Keine Command-Dateien gefunden im commands/ Ordner.');
    console.log('ℹ️  Füge .js Dateien mit Slash Commands hinzu und führe dieses Skript erneut aus.');
    process.exit(0);
}

// Lade alle Commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Command geladen: ${command.data.name}`);
    } else {
        console.log(`⚠️  [WARNUNG] Der Command in ${file} fehlt eine "data" oder "execute" property.`);
    }
}

// REST API Instanz erstellen
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Commands deployen
(async () => {
    try {
        console.log(`\n🔄 Starte Deployment von ${commands.length} Slash Command(s)...`);

        // Für globale Commands (dauert bis zu 1 Stunde):
        // const data = await rest.put(
        //     Routes.applicationCommands(process.env.CLIENT_ID),
        //     { body: commands },
        // );

        // Für Guild-spezifische Commands (sofort verfügbar):
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Erfolgreich ${data.length} Slash Command(s) deployed!`);
        
        // Liste alle deployten Commands auf
        console.log('\n📋 Deployte Commands:');
        data.forEach(cmd => {
            console.log(`   - /${cmd.name}: ${cmd.description || 'Keine Beschreibung'}`);
        });

    } catch (error) {
        console.error('❌ Fehler beim Deployen der Commands:');
        console.error(error);
        process.exit(1);
    }
})();
