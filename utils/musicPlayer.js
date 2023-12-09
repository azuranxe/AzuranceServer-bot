const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('/home/azurance/azurance-bot/myMusicDatabase.db', (err) => {
  if (err) {
      console.error(err.message);
  } else {
      console.log('Connected to the temporary database.');
      setupTable();
  }
});


function setupTable() {
  db.run(`CREATE TABLE IF NOT EXISTS CurrentSong (
      SongID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Artist TEXT,
      Album TEXT,
      Genre TEXT,
      ReleaseYear INTEGER,
      CoverArtPath TEXT,
      FilePath TEXT NOT NULL,
      UNIQUE (Title, Artist, FilePath)
  )`);
}

async function getRandomSong(db) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT Title, FilePath FROM Song ORDER BY RANDOM() LIMIT 1`, (err, row) => {
      if (err) {
        console.error('Error fetching random song from the database:', err.message);
        reject(err);
      } else if (row && row.length > 0) {
        const randomSong = {
          title: row[0].Title,
          filePath: row[0].FilePath
        };
        console.log('Random Song:', randomSong);
        resolve(randomSong);
      } else {
        console.error('No songs found in the database.');
        reject(new Error('Không có một bài nào trong database.'));
      }
    });
  });
}

function getTotalSongCount(db) {
  return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(SongID) AS count FROM Song", (err, row) => {
          if (err) {
              reject(err);
          } else {
              resolve(row.count);
          }
      });
  });
}


function getRandomSongs(db, totalCount) {
  return new Promise((resolve, reject) => {
      console.log("totalCount before parsing:", totalCount, "Type:", typeof totalCount);

      totalCount = parseInt(totalCount, 10);

      console.log("totalCount after parsing:", totalCount);

      if (isNaN(totalCount)) {
          reject(new Error("Invalid totalCount value"));
          return;
      }

      const query = `
          SELECT 
              Song.Title, 
              Song.FilePath, 
              Song.Artist, 
              Song.Album, 
              Song.CoverArtPath, 
              Song.Genre, 
              Song.ReleaseYear
          FROM Song
          ORDER BY RANDOM() 
          LIMIT ?`;

      db.all(query, [totalCount], (err, rows) => {
          if (err) {
              console.error('Error fetching random songs from the database:', err.message);
              reject(err);
          } else {
              const songs = rows.map(row => ({
                  title: row.Title,
                  filePath: row.FilePath,
                  artist: row.Artist,
                  album: row.Album,
                  coverArtPath: row.CoverArtPath,
                  genre: row.Genre,
                  releaseYear: row.ReleaseYear
              }));
              resolve(songs);
          }
      });
  });
}

function getCurrentSongMetadata() {
  return new Promise((resolve, reject) => {
      db.get('SELECT Title, Artist, Album, Genre, ReleaseYear, CoverArtPath FROM CurrentSong', (err, row) => {
          if (err) {
              console.error('Error fetching data from the database:', err.message);
              reject(err);
          } else if (!row) {
              console.error('No current song data found in database.');
              resolve(null);
          } else {
              resolve(row);
          }
      });
  });
}

function insertCurrentSongMetadata(song) {
  db.run('DELETE FROM CurrentSong', (err) => {
      if (err) {
          console.error('Error clearing current_song table:', err.message);
          return;
      }

      db.run('INSERT INTO CurrentSong (Title, Artist, Album, Genre, ReleaseYear, FilePath, CoverArtPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [song.Title, song.Artist, song.Album, song.Genre, song.ReleaseYear, song.FilePath, song.CoverArtPath], (insertErr) => {
              if (insertErr) {
                  console.error('Error inserting into current_song:', insertErr.message);
              } else {
                  console.log('Current song inserted successfully');
              }
          });
  });
}

module.exports = { getRandomSong, getRandomSongs, getTotalSongCount, getCurrentSongMetadata, insertCurrentSongMetadata };
