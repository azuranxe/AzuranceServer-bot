const { Client, Events, GatewayIntentBits, ActivityType, SlashCommandBuilder, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path')
const { Player } = require('discord-player');
const ffmpeg = require('fluent-ffmpeg');
const {db} = require('./updateDatabase.js')

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildVoiceStates] });

const queue = new Map();

require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENTID;
const guildId = process.env.DISCORD_GUILDID;

const LOAD_SLASH = process.argv.includes("load");

client.player = new Player(client, {
    ytldOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
})

// function createQueue
function createQueue(guildId) {
    return {
        voiceChannel: '1181385985808937001',
        textChannel: '1181385985808937001',
        connection: null,
        songs: [],
        volume: 10,
        playing: true,
        shuffle: false,
    };
};

// deploy slash commands
client.slashcommands = new Collection();
const { currentSlashCommand } = require('/home/azurance/azurance-bot/slashCommands/currentSlashCommand.js');
const { skipSlashCommand } = require('/home/azurance/azurance-bot/slashCommands/skipSlashCommand.js');
const { searchSlashCommand } = require('/home/azurance/azurance-bot/slashCommands/searchSlashCommand.js');

const commands = [];

const commandsPath = path.join(__dirname, 'slashCommands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.slashcommands.set(command.data.name, command);

    // if load command for registration, add to array
    if (LOAD_SLASH) {
        commands.push(command.data.toJSON());
    };
};

//Then use this array to register commands with Discord API if needed
if (LOAD_SLASH) {
    const rest = new REST({version: '10'}).setToken(token);
    console.log('Đang chạy Slash Commands');
    rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENTID, process.env.DISCORD_GUILDID),
    {body: commands})
        .then(() => {
            console.log('Thành công tải hệ thống commands');
            process.exit(0);
        })
        .catch((err) => {
            console.error(err);
            process.exit(1)
        });
} // log in node.js và deploy command execution 
else {client.once('ready', () => {
    console.log(`${client.user.tag} đã sẵn sàng rung ~ cảm`);
    
    client.user.setPresence({
        activities: [{
            name: 'Playlist của Thiên',
            type: ActivityType.Listening
        }],
        status: 'online'
        }) 
    }) 
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const command = client.slashcommands.get(interaction.commandName);
        if (!command) return;

        try { 
            if (command.name === 'skip') {
                skipSlashCommand.execute(interaction, queue, db);
            } else if (command.name === 'current') {
                currentSlashCommand.execute(interaction, queue, db);
            } else if (command.name === 'search') {
                searchSlashCommand.execute(interaction)
            } else {
                await command.execute(interaction, queue, createQueue, db);
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Đã xảy ra lỗi khi xử lí lệnh này.',
                ephemeral: true
            });
        }
    });
}

// đăng nhập
client.login(token);
