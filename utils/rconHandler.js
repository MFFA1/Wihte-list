const Rcon = require('rcon');

/**
 * Sendet die Whitelist an den Minecraft Server via RCON
 * @param {Array} whitelist - Array von Whitelist-Einträgen mit name und uuid
 * @returns {Promise<Object>} - Ergebnis der RCON-Operation
 */
async function sendWhitelistToServer(whitelist) {
    const rconHost = process.env.RCON_HOST;
    const rconPort = parseInt(process.env.RCON_PORT || '25575');
    const rconPassword = process.env.RCON_PASSWORD;

    // Validiere RCON-Konfiguration
    if (!rconHost || !rconPassword) {
        throw new Error('RCON-Konfiguration fehlt! Bitte RCON_HOST und RCON_PASSWORD in .env setzen.');
    }

    return new Promise((resolve, reject) => {
        const conn = new Rcon(rconHost, rconPort, rconPassword);

        conn.on('auth', async () => {
            console.log('✅ RCON-Verbindung authentifiziert');

            try {
                // Lösche alle Whitelist-Einträge
                conn.send('whitelist clear');
                console.log('🗑️ Whitelist geleert');

                // Füge alle Einträge hinzu
                for (const entry of whitelist) {
                    const command = `whitelist add ${entry.name}`;
                    conn.send(command);
                    console.log(`➕ Hinzugefügt: ${entry.name}`);
                }

                // Reload Whitelist
                conn.send('whitelist reload');
                console.log('🔄 Whitelist neu geladen');

                conn.disconnect();
                resolve({
                    success: true,
                    message: `${whitelist.length} Spieler zur Server-Whitelist hinzugefügt`,
                    count: whitelist.length
                });

            } catch (error) {
                conn.disconnect();
                reject(error);
            }
        });

        conn.on('error', (err) => {
            console.error('❌ RCON-Fehler:', err.message);
            reject(new Error(`RCON-Verbindung fehlgeschlagen: ${err.message}`));
        });

        conn.on('end', () => {
            console.log('🔌 RCON-Verbindung geschlossen');
        });

        try {
            conn.connect();
        } catch (error) {
            reject(new Error(`Verbindung zu RCON konnte nicht hergestellt werden: ${error.message}`));
        }
    });
}

/**
 * Fügt einen einzelnen Spieler zur Server-Whitelist hinzu
 * @param {string} minecraftName - Der Minecraft-Name des Spielers
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
async function addPlayerToServer(minecraftName) {
    const rconHost = process.env.RCON_HOST;
    const rconPort = parseInt(process.env.RCON_PORT || '25575');
    const rconPassword = process.env.RCON_PASSWORD;

    if (!rconHost || !rconPassword) {
        throw new Error('RCON-Konfiguration fehlt!');
    }

    return new Promise((resolve, reject) => {
        const conn = new Rcon(rconHost, rconPort, rconPassword);

        conn.on('auth', () => {
            const command = `whitelist add ${minecraftName}`;
            conn.send(command);
            
            setTimeout(() => {
                conn.disconnect();
                resolve({
                    success: true,
                    message: `${minecraftName} zum Server hinzugefügt`
                });
            }, 500);
        });

        conn.on('error', (err) => {
            reject(new Error(`RCON-Fehler: ${err.message}`));
        });

        conn.connect();
    });
}

/**
 * Entfernt einen Spieler von der Server-Whitelist
 * @param {string} minecraftName - Der Minecraft-Name des Spielers
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
async function removePlayerFromServer(minecraftName) {
    const rconHost = process.env.RCON_HOST;
    const rconPort = parseInt(process.env.RCON_PORT || '25575');
    const rconPassword = process.env.RCON_PASSWORD;

    if (!rconHost || !rconPassword) {
        throw new Error('RCON-Konfiguration fehlt!');
    }

    return new Promise((resolve, reject) => {
        const conn = new Rcon(rconHost, rconPort, rconPassword);

        conn.on('auth', () => {
            const command = `whitelist remove ${minecraftName}`;
            conn.send(command);
            
            setTimeout(() => {
                conn.disconnect();
                resolve({
                    success: true,
                    message: `${minecraftName} vom Server entfernt`
                });
            }, 500);
        });

        conn.on('error', (err) => {
            reject(new Error(`RCON-Fehler: ${err.message}`));
        });

        conn.connect();
    });
}

module.exports = {
    sendWhitelistToServer,
    addPlayerToServer,
    removePlayerFromServer
};
