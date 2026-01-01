# RCON-Konfiguration für Minecraft Server

## Was ist RCON?

RCON (Remote Console) ermöglicht es dem Bot, direkt Befehle auf deinem Minecraft-Server auszuführen. Damit wird die Whitelist automatisch mit dem Server synchronisiert.

## Server-Konfiguration

### 1. RCON auf dem Minecraft-Server aktivieren

Öffne die `server.properties` Datei deines Minecraft-Servers und setze folgende Werte:

```properties
enable-rcon=true
rcon.port=25575
rcon.password=DeinSicheresPasswort123
```

**Wichtig:** Wähle ein **sicheres** Passwort!

### 2. Server neu starten

Starte deinen Minecraft-Server neu, damit die RCON-Einstellungen übernommen werden.

### 3. Firewall-Regel (falls nötig)

Wenn dein Server eine Firewall hat, stelle sicher, dass der RCON-Port (Standard: 25575) geöffnet ist:

```bash
# Beispiel für ufw (Ubuntu/Debian)
sudo ufw allow 25575/tcp

# Beispiel für firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=25575/tcp
sudo firewall-cmd --reload
```

## Bot-Konfiguration

### .env Datei anpassen

Bearbeite die `.env` Datei in deinem Bot-Verzeichnis:

```env
# RCON-Konfiguration für Minecraft Server
RCON_HOST=123.456.789.10        # IP-Adresse deines Servers
RCON_PORT=25575                  # RCON-Port (Standard: 25575)
RCON_PASSWORD=DeinSicheresPasswort123  # Das Passwort aus server.properties
```

**Beispiele:**
- Lokaler Server: `RCON_HOST=localhost`
- Externer Server: `RCON_HOST=123.456.789.10`
- Domain: `RCON_HOST=minecraft.deine-domain.de`

## Verwendung

### Automatische Synchronisation

Wenn ein Spieler zur Whitelist hinzugefügt wird, wird er **automatisch** auch auf dem Server hinzugefügt.

### Manuelle Synchronisation

Nutze den Command `/sync-whitelist` um die komplette Whitelist manuell zu synchronisieren:

```
/sync-whitelist
```

Dieser Command:
- ✅ Löscht die alte Server-Whitelist
- ✅ Fügt alle Spieler aus der Bot-Whitelist hinzu
- ✅ Lädt die Whitelist auf dem Server neu

**Hinweis:** Nur Administratoren können diesen Command nutzen.

## Funktionsweise

### Bei Akzeptierung einer Whitelist-Anfrage:
1. Spieler wird in `whitelist.json` gespeichert
2. Bot sendet `whitelist add <spielername>` via RCON zum Server
3. Spieler kann sofort beitreten

### Bei manueller Synchronisation:
1. Bot sendet `whitelist clear` (löscht alte Einträge)
2. Bot sendet `whitelist add <spielername>` für jeden Spieler
3. Bot sendet `whitelist reload` (lädt Whitelist neu)

## Fehlerbehebung

### "RCON-Konfiguration fehlt"
- Überprüfe ob `RCON_HOST` und `RCON_PASSWORD` in `.env` gesetzt sind
- Bot neu starten nach Änderungen an `.env`

### "RCON-Verbindung fehlgeschlagen"
- Prüfe ob RCON auf dem Server aktiviert ist (`enable-rcon=true`)
- Prüfe ob die IP-Adresse korrekt ist
- Prüfe ob das Passwort übereinstimmt
- Prüfe ob der Port korrekt ist (Standard: 25575)
- Prüfe Firewall-Einstellungen

### "Connection refused"
- Server ist nicht erreichbar
- RCON-Port ist blockiert (Firewall)
- Falscher Port konfiguriert

### Test der RCON-Verbindung

Du kannst RCON auch manuell testen mit Tools wie:
- `mcrcon` (Command-Line Tool)
- `Minecraft RCON Console` (GUI-Tool)

Beispiel mit mcrcon:
```bash
mcrcon -H 123.456.789.10 -P 25575 -p DeinPasswort "list"
```

## Sicherheitshinweise

⚠️ **Wichtig:**
- Verwende ein **starkes** RCON-Passwort
- Öffne den RCON-Port **nur** für vertrauenswürdige IPs
- Speichere das `.env` File **niemals** in Git (ist bereits in `.gitignore`)
- Nutze wenn möglich zusätzliche Firewall-Regeln

## Deaktivierung von RCON

Falls du RCON nicht nutzen möchtest:
- Der Bot funktioniert weiterhin normal
- Die Whitelist wird nur in der `whitelist.json` gespeichert
- Du musst die Whitelist manuell auf den Server übertragen
- Eine Warnung erscheint in der Konsole, aber es gibt keinen Fehler

## Support

Bei Problemen:
1. Überprüfe die Logs in der Konsole
2. Teste die RCON-Verbindung manuell
3. Überprüfe Server- und Bot-Konfiguration
