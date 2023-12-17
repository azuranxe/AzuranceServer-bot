const { Routes, Collection, REST } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        if (config.guildId) {
            // Registering commands for a specific guild
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands },
            );
            console.log(`Successfully registered commands for guild ${config.guildId}.`);
        } else {
            // Registering global commands
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands },
            );
            console.log('Successfully registered global commands.');
        }
    } catch (error) {
        console.error(error);
    }
})();
