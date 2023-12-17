const { Client, GatewayIntentBits, ActivityType, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

global.songQueue = [];

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`${commandsPath}/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`${client.user.tag} đã đăng nhập thành công!`);
    client.user.setPresence({
      activities: [{
          name: 'Playlist của Thiên',
          type: ActivityType.Listening
      }],
      status: 'online'
      }) 
  }) 

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Có lỗi hệ thống xảy ra khi xử lí lệnh này!', ephemeral: true });
        }
    }
} else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && command.handleAutocomplete) {
        await command.handleAutocomplete(interaction);
    }
  }
});

client.login(config.token);
