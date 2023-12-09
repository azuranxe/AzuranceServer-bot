const albums = require('/home/azurance/azurance-bot/utils/albums.json');
const {db} = require('/home/azurance/azurance-bot/updateDatabase.js');

function getRandomAlbum() {
  const randomIndex = Math.floor(Math.random() * albums.length);
  return albums[randomIndex];
}

async function getRandomTrack() {
  return new Promise((resolve, reject) => {
      const query = `SELECT * FROM Song ORDER BY RANDOM() LIMIT 1`;
      db.get(query, (err, row) => {
          if (err) {
              reject(err);
          } else {
              resolve(row); // Returns a random song object from the database
          }
      });
  });
}

module.exports = {getRandomAlbum, getRandomTrack}
