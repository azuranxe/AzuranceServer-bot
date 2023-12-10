const { createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { getRandomSongs, getTotalSongCount, insertCurrentSongMetadata } = require('/home/azurance/azurance-bot/utils/musicPlayer.js');

const playedSongs = new Set();

function createQueue(guildId) {
  return {
      voiceChannel: '1181385985808937001',
      textChannel: '1181385985808937001',
      connection: null,
      songs: [],
      isPlaying: false,
      volume: 90,
      playing: true,
      shuffle: false,
  };
};

async function playMusic(guildId, queue, db) {

  let guildQueue = queue.get(guildId);
  
  if (!guildQueue || guildQueue.songs.length === 0) {
    if (playedSongs.size === await getTotalSongCount(db)) {
        playedSongs.clear();
    }

    const newSongs = await getRandomSongs(db, await getTotalSongCount(db));
    if (!guildQueue) {
      guildQueue = { songs: [], isPlaying: false, connection: null, voiceChannel: null };
      queue.set(guildId, guildQueue) 
    }
    guildQueue.songs.push(...newSongs)
  }

  if (!guildQueue.isPlaying && guildQueue.songs.length > 0) {
    guildQueue.isPlaying = true;
    const songIndex = Math.floor(Math.random() * guildQueue.songs.length);
    const song = guildQueue.songs.splice(songIndex, 1)[0];
    playedSongs.add(song);

    if (song) {
      insertCurrentSongMetadata({
        Title: song.title || 'Unknown Title',
        Artist: song.artist || 'Unknown Artist',
        Album: song.album || 'Unknown Album',
        Genre: song.genre || 'Unknown Genre',
        ReleaseYear: song.releaseYear || 'Unknown Year',
        FilePath: song.filePath || 'Unknown FilePath',
        CoverArtPath: song.coverArtPath || null
      });

      console.log(`Playing Song:`, song.title);

      if (!song.filePath) {
        console.error('Song file path undefined.');
        guildQueue.isPlaying = false;
        return;
      }

      const audioResource = createAudioResource(song.filePath);
      const player = createAudioPlayer();
      player.play(audioResource);
      guildQueue.connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        guildQueue.isPlaying = false; // Mark as not playing
        playMusic(guildId, queue, db); // Play the next song
      });

      player.on('error', error => console.error(`Error: ${error.message}`));
    } else {
      console.log('No song to play');
      guildQueue.isPlaying = false;
    }
  }
}

module.exports = { playMusic, createQueue };
