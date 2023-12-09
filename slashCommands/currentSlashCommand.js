const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCurrentSongMetadata } = require('/home/azurance/azurance-bot/utils/musicPlayer.js')

function getRandomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    const color = (red << 16) | (green << 8) | blue;
    return `#${color.toString(16).padStart(6, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('current')
        .setDescription('Hiển thị thông tin về bài hát đang phát'),

       async execute(interaction) {
        try {
            const songData = await getCurrentSongMetadata();

            if (!songData) {
                return interaction.reply({
                    content: 'Không tìm thấy data cho mục này.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(`Hiện đang phát: ${songData.Title}`)
                .setThumbnail(songData.CoverArtPath) // Use the valid URL
                .addFields(
                    { name: 'Nghệ sĩ', value: `${songData.Artist}`, inline: true },
                    { name: 'Album', value: `${songData.Album}`, inline: true },
                    { name: 'Thể loại', value: `${songData.Genre}`, inline: true },
                    { name: 'Năm phát hành', value: `${songData.ReleaseYear}`, inline: true }
                )
                .setFooter({ text: `Yêu cầu được gửi bởi: ${interaction.user.discriminator != 0 ? interaction.user.tag : interaction.user.username}` })
                .setTimestamp();

            interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (err) {
            console.error('Error fetching current song:', err);
            interaction.reply({
                content: 'Lỗi xảy ra khi fetch data.',
                ephemeral: true
            });
        }
    },
};