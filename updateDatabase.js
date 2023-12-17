const sqlite3 = require('sqlite3').verbose();
const mm = require('music-metadata');
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./musicDatabase.db');

// Creating the Albums Table first
db.run(`CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  artist TEXT,
  release_year INTEGER,
  cover_art_path TEXT NULL,
  UNIQUE(name, artist) ON CONFLICT IGNORE
)`);

db.run(`CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  artist TEXT,
  album TEXT,
  release_year INTEGER,
  filePath TEXT,
  played INTEGER DEFAULT 0,
  cover_art_path TEXT NULL,
  track_number INTEGER,
  album_id INTEGER,
  FOREIGN KEY (album_id) REFERENCES albums(id)
)`);

// Function to process a music file
async function processMusicFile(filePath) {
  try {
      const metadata = await mm.parseFile(filePath);
      const songName = metadata.common.title || path.basename(filePath, path.extname(filePath));
      const albumName = metadata.common.album || 'Unknown Album';
      const songArtist = metadata.common.artist || 'Unknown Artist';
      const albumArtist = metadata.common.albumartist || songArtist;
      const releaseYear = metadata.common.year || null;
      const trackNumber = metadata.common.track.no || 0; // Default track number to 0 if not available

      const albumId = await insertAlbum(albumName, albumArtist, releaseYear);
      insertSong(songName, songArtist, albumName, releaseYear, albumId, trackNumber, filePath);
  } catch (err) {
      console.error(`Lỗi xử lí ${filePath}: ${err.message}`);
  }
}


// Function to insert an album into the albums table and return its ID
function insertAlbum(name, artist, releaseYear) {
    return new Promise((resolve, reject) => {
        const checkQuery = `SELECT id FROM albums WHERE TRIM(name) = TRIM(?) AND TRIM(artist) = TRIM(?)`;
        db.get(checkQuery, [name, artist], function(err, row) {
            if (err) {
                reject(err);
                return;
            }
            if (!row) { // If the album does not exist, insert it
                const insertQuery = `INSERT INTO albums (name, artist, release_year) VALUES (TRIM(?), TRIM(?), ?)`;
                db.run(insertQuery, [name, artist, releaseYear], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`Thêm album mới vào database: ${name} bởi ${artist}`);
                    resolve(this.lastID);
                });
            } else {
                resolve(row.id); // If album exists, just return its ID without logging
            }
        });
    });
}

// Function to insert a song into the songs table
function insertSong(name, artist, album, releaseYear, albumId, trackNumber, filePath) {
    const checkQuery = `SELECT id FROM songs WHERE TRIM(name) = TRIM(?) AND TRIM(artist) = TRIM(?) AND album_id = ?`;
    db.get(checkQuery, [name, artist, albumId], function(err, row) {
        if (err) {
            console.error(err.message);
            return;
        }
        if (!row) { // If the song does not exist, insert it
            const insertQuery = `INSERT INTO songs (name, artist, album, release_year, album_id, track_number, filePath) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertQuery, [name, artist, album, releaseYear, albumId, trackNumber, filePath], function(err) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(`Database đã được thêm bài mới tại ${this.lastID}`);
            });
        }
        // If song exists, do nothing (no log)
    });
}


// Directory containing music files
const musicDirectory = './music-database';

// Read all files from the music directory and process them
fs.readdir(musicDirectory, (err, files) => {
    if (err) {
        return console.error(`Lỗi đọc file: ${err.message}`);
    }

    files.forEach(file => {
        const filePath = path.join(musicDirectory, file);
        processMusicFile(filePath);
    });
});

// Note: Handle the closing of the database appropriately
// db.close(); // Uncomment and move to a suitable place
