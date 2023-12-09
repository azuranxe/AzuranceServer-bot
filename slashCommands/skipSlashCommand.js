const { SlashCommandBuilder } = require('discord.js');
const allowedRoleIds= ['961755241366306826', '1061822830175596604', '962400274088095744', '1022441881528975390', '962452151425175562', '962452024593629354', '962451948982894652', '962451835145306132', '962451830850351155', '962451523172990976', '962414108907561010',];


module.exports = { 
  data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Bỏ qua bài hát hiện đang bật'),

    async execute(interaction, queue, createQueue, db) {
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
      const guildId = interaction.guildId;
      const guildQueue = queue.get(guildId);

      if (!guildQueue || !guildQueue.player || guildQueue.songs.length === 0) {
          return interaction.reply({
              content: 'Hiện không có bài hát nào trong queue.',
              ephemeral: true
          });
      }

      guildQueue.player.stop();

      interaction.reply({
          content: 'Đã bỏ qua bài hát hiện đang phát.',
          ephemeral: true
      });
  }
};
