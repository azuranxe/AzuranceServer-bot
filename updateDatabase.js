const sqlite3 = require('sqlite3').verbose();
const fs = require('node:fs');
const path = require('node:path');
const mm = require('music-metadata');

const musicDirectory = './music-database';

const db = new sqlite3.Database('./myMusicDatabase.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
        setupTables();
        setupAlbumTable();
        scanAndUpdateMusicDatabase()
    }
});

function setupTables() {
    db.run(`CREATE TABLE IF NOT EXISTS Song (
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

function setupAlbumTable() {
    db.run(`CREATE TABLE IF NOT EXISTS Album (
        AlbumID INTEGER PRIMARY KEY AUTOINCREMENT,
        Album TEXT NOT NULL,
        Artist TEXT,
        ReleaseYear INTEGER,
        CoverArtPath TEXT,
        UNIQUE (Album, Artist)
    )`)
}
  
function isMusicFile(file) {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.ogg', '.flac'].includes(ext);
}

function saveCoverArtToFile(coverArtData, songFilePath, mimeType) {
    const imageDirectory = './cover-art-images';
    if (!fs.existsSync(imageDirectory)) {
        fs.mkdirSync(imageDirectory, { recursive: true });
    }
    const baseName = path.basename(songFilePath, path.extname(songFilePath));
    const extension = mimeType.split('/')[1];
    const filename = `${baseName}.${extension}`;
    const filePath = path.join(imageDirectory, filename);
    fs.writeFileSync(filePath, coverArtData, 'base64');
    return filePath;
}

function extractSongData(filePath, metadata) {
    let coverArtPath = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
        const imageBuffer = metadata.common.picture[0].data;
        const imageFormat = metadata.common.picture[0].format;
        if (imageBuffer && imageFormat) {
            coverArtPath = saveCoverArtToFile(imageBuffer, filePath, imageFormat);
        }
    }
    return {
        song: {
        title: metadata.common.title,
        artist: metadata.common.artist,
        albumartist: metadata.common.albumartist,
        album: metadata.common.album,
        duration: metadata.format.duration,
        filePath: filePath,
        releaseYear: metadata.common.year,
        genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown Genre',
        coverArt: coverArtPath
        },
        album: {
            album: metadata.common.album,
            artist: metadata.common.albumartist || metadata.common.artist,
            releaseYear: metadata.common.year,
            coverArtPath: coverArtPath
        }
    };
}

// Function to insert or update song data in the database
function upsertSong(songData) {
    const upsertSongSQL = `INSERT INTO Song (Title, Artist, Album, Genre, ReleaseYear, CoverArtPath, FilePath)
                           VALUES (?, ?, ?, ?, ?, ?, ?)
                           ON CONFLICT(Title, Artist, FilePath) DO UPDATE SET Title = excluded.Title;`;
    db.run(upsertSongSQL, [songData.title, songData.artist, songData.album, songData.genre, songData.releaseYear, songData.coverArt, songData.filePath], err => {
        if (err) {
            console.error("Error upserting into Songs table:", err);
        }
    });
}

// Function to insert song data into the database

function insertSongIntoDatabase(songData) {
    if (!songData) return;

    upsertSong(songData);
}

// Function to insert or update album data in the database
function upsertAlbum(albumData) {
    const upsertAlbumSQL = `INSERT INTO Album (Album, Artist, ReleaseYear, CoverArtPath)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT(Album, Artist) DO UPDATE SET
                                ReleaseYear = excluded.ReleaseYear,
                                CoverArtPath = excluded.CoverArtPath;`;

    db.run(upsertAlbumSQL, [albumData.album, albumData.artist, albumData.releaseYear, albumData.coverArtPath], err => {
        if (err) {
            console.error("Error upserting into Albums table:", err);
        }
    });
}

// Function to insert album data into the database
function insertAlbumIntoDatabase(albumData) {
    if (!albumData) return;

    upsertAlbum(albumData);
}

function scanAndUpdateMusicDatabase() {
    fs.readdir(musicDirectory, (err, files) => {
        if (err) {
            console.error("Error reading music directory:", err);
            return;
        }
        files.forEach(file => {
            if (isMusicFile(file)) {
                const filePath = path.join(musicDirectory, file);
                mm.parseFile(filePath)
                    .then(metadata => {
                        const data = extractSongData(filePath, metadata);
                        insertSongIntoDatabase(data.song);
                        insertAlbumIntoDatabase(data.album);
                    })
                    .catch(err => {
                        console.error("Error reading metadata:", err);
                    });
            }
        });
    });
}

module.exports = {
    db,
    insertSongIntoDatabase
}
