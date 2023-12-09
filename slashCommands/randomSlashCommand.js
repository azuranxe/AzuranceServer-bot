const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {getRandomAlbum, getRandomTrack} = require('/home/azurance/azurance-bot/utils/getRandomAlbum.js');

// Function to generate a random color
function getRandomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    const color = (red << 16) | (green << 8) | blue;
    return `#${color.toString(16).padStart(6, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Lấy gợi ý nghe nhạc random từ Thiên :3')
        .addSubcommand(subcommand => subcommand.setName('song').setDescription('Gợi ý nghe một track đơn '))
        .addSubcommand(subcommand => subcommand.setName('album').setDescription('Gợi ý nghe một album')),

    async execute(interaction, client, db) {
        if (interaction.options.getSubcommand() === 'song') {
            const track = await getRandomTrack();

            if (track) {
                const embedtrack = new EmbedBuilder()
                    .setTitle(`Bạn nên nghe thử:`)
                    .setDescription(`**${track.Title} của** ***${track.Artist}***`)
                    .setColor(getRandomColor());

                if (track.CoverArtPath) {
                    embedtrack.setThumbnail(track.CoverArtPath);
                }
                await interaction.reply({ embeds: [embedtrack], ephemeral: true });
            } else {
                await interaction.reply({ content: "Hiện Thiên không có đề nghị nào cho bạn, thông cảm nha TvT", ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === 'album') {
            const album = getRandomAlbum();
            if (album) {
                const embedalbum = new EmbedBuilder()
                    .setTitle(`Bạn nên nghe thử:`)
                    .setDescription(`**${album.title} của** ***${album.artist}***`)
                    .setColor(getRandomColor());

                if (album.coverArtPath) {
                    embedalbum.setThumbnail(album.coverArtPath);
                }
                await interaction.reply({ embeds: [embedalbum], ephemeral: true });
            } else {
                await interaction.reply({ content: "Hiện Thiên không có đề nghị album nào cho bạn, thông cảm nha TvT", ephemeral: true });
            }
        }
    } // end of execute function
};
