const ffmpeg = require('fluent-ffmpeg');

function convertAudio(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioCodec('libmp3lame') // Use the MP3 codec
      .audioBitrate('128k') // Set the audio bitrate to 128kbps
      .audioFrequency(44100) // Set the audio sample rate to 44.1kHz
      .on('end', () => resolve(outputFilePath))
      .on('error', (err) => reject(err))
      .save(outputFilePath);
  });
}

module.exports = {
  convertAudio,
};
