const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { getRandomSongs, getTotalSongCount, insertCurrentSongMetadata } = require('/home/azurance/azurance-bot/utils/musicPlayer.js');
const path = require('path');

const playedSongs = new Set();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect')
    .setDescription('Kết nối vào kênh nhạc để bắt đầu rung ~ cảm âm thanh'),

  async execute(interaction, queue, createQueue, db) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Bạn phải là admin mới có thể sử dụng lệnh này.', ephemeral: true });
    }

    const voiceChannelId = interaction.member.voice.channelId;
    if (!voiceChannelId) {
      return interaction.reply({ content: 'Bạn cần phải kết nối với kênh nhạc để dùng lệnh này.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);
    const guildId = interaction.guildId;
    const guildQueue = queue.get(guildId) || createQueue(guildId);

    // Refill the song queue if all songs have been played
    if (playedSongs.length === await getTotalSongCount(db)) {
      playedSongs.length = 0; // Clear the played songs
    }

    if (guildQueue.songs.length === 0) {
      const allSongs = await getRandomSongs(db, await getTotalSongCount(db));
      guildQueue.songs.push(...allSongs);
    }

    // Connect to the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    guildQueue.voiceChannel = voiceChannel;
    guildQueue.connection = connection;
    queue.set(guildId, guildQueue);

    connection.on(VoiceConnectionStatus.Ready, () => {
      playMusic(guildId, queue, db);
    });

    await interaction.reply({ content: `Đã kết nối với kênh <#${voiceChannelId}> và bắt đầu rung ~ cảm`, ephemeral: true });

    async function playMusic(guildId, queue, db) {
      const guildQueue = queue.get(guildId);
      if (!guildQueue || guildQueue.songs.length === 0) {
        if (playedSongs.size === await getTotalSongCount(db)) {
            playedSongs.clear();
            const newSongs = await getRandomSongs(db, await getTotalSongCount(db));
            guildQueue.songs.push(...newSongs);
        }
        else if (guildQueue.voiceChannel) {
          guildQueue.voiceChannel.leave()
          queue.delete(guildId);
          return;  
        }
      }

      const songIndex = Math.floor(Math.random() * guildQueue.songs.length);
      const song = guildQueue.songs.splice(songIndex, 1)[0];
      if (song) {
        playedSongs.add(song);
      }

      insertCurrentSongMetadata({
        Title: song.title || 'Unknown Title',
        Artist: song.artist || 'Unknown Artist',
        Album: song.album || 'Unknown Album',
        Genre: song.genre || 'Unknown Genre',
        ReleaseYear: song.releaseYear || 'Unknown Year',
        FilePath: song.filePath || 'Unknown FilePath',
        CoverArtPath: song.coverArtPath || null
      });

      console.log(`Song:`, song.title)

      if (!song.filePath) {
        console.error('Song file path undefined.');
        return;
      }

      const audioResource = createAudioResource(song.filePath);
      const player = createAudioPlayer();

      player.play(audioResource);
      guildQueue.connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        playMusic(guildId, queue, db);
      });

      player.on('error', error => console.error(`Error: ${error.message}`));
    }
  },
};
