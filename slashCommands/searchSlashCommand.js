const { SlashCommandBuilder, EmbedBuilder, AutocompleteInteraction } = require('discord.js');
const { db } = require('/home/azurance/azurance-bot/updateDatabase.js');
const allowedRoleIds= ['961755241366306826', '1061822830175596604', '962400274088095744', '1022441881528975390', '962452151425175562', '962452024593629354', '962451948982894652', '962451835145306132', '962451830850351155', '962451523172990976', '962414108907561010',];


module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Tra một bài hát có tồn tại trong playlist của Thiên')
        .addStringOption(option => 
            option.setName('track')
                  .setDescription('Nhập tên bài hát bạn muốn tìm nhé!')
                  .setAutocomplete(true)
                  .setRequired(true)),

    async execute(interaction) {

      const member = interaction.member;
      const hasAllowedRole = member.roles.cache.some(role => allowedRoleIds.includes(role.id));
      if(!hasAllowedRole) {
        return interaction.reply({
          content: 'Bạn phải là thành viên của hội chat riêng để dùng lệnh này.',
          ephemeral: true
        });
      }
  
      if (!interaction.member.voice.channel) {
          return interaction.reply({
              content: 'Bạn cần phải kết nối với kênh nhạc để dùng lệnh này.',
              ephemeral: true
          });
      }

        const trackName = interaction.options.getString('track');
        const track = await findSongByName(trackName);

        const embed = new EmbedBuilder();
        if (track) {
            embed.setTitle(`Hiện đã thêm vào danh sách phát`)
                .setDescription(`**${track.title} của** ***${track.artist}***`)
                .setColor('Green');
            if (track.coverArtPath) {
              embed.setThumbnail(`file://${track.coverArtPath}`)
            }

            const queue = getQueue(interaction.guildId); 
            queue.add(track); 
    
            if (!queue.isPlaying) {
                playMusic(interaction.guildId); 
            }

        } else {
            embed.setTitle(`Không có "${trackName} trong playlist của Thiên mất rồi..."`)
                .setColor('Red')
                .setDescription(`Bạn có thể liên hệ với Thiên để thêm nhạc nha!!!`);
        }
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    async handleAutocomplete(interaction) {
      const focusedValue = interaction.options.getFocused();
      const choices = await searchSongs(focusedValue);
      await interaction.respond(choices.map(choice => ({ name: choice.title, value: choice.title })));

    }


};

async function findSongByName(name) {
 return new Promise((resolve, reject) => {
  const query = `SELECT * FROM Song WHERE Title LIKE ? LIMIT 1`;
  db.get(query, [`%${name}%`], (err, row) => {
      if (err) {
          reject(err);
      } else {
          resolve(row); 
      }
  });
});
}

async function searchSongs(searchQuery) {
  return new Promise((resolve, reject) => {
      const query = `SELECT * FROM Song WHERE Title LIKE ? OR Artist LIKE ? LIMIT 8`; // Limit results to 10 for efficiency
      db.all(query, [`%${searchQuery}%`, `%${searchQuery}%`], (err, rows) => {
          if (err) {
              reject(err);
          } else {
              resolve(rows); // Returns an array of song objects that match the searchQuery
          }
      });
  });
}
