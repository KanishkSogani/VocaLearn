import fs from 'fs';
import path from 'path';
import { processAudioStream} from '../src/asr';
import { supportedLanguages } from '../src/utils/languages';



describe('processAudioStream', () => {
  it('should transcribe audio counting from ten to one', async () => {
    const audioPath = path.join(__dirname, './test-audio.wav');
    const audioBuffer = fs.readFileSync(audioPath);

    const language = 'en-US';
    expect(supportedLanguages).toContain(language);

    const result = await processAudioStream([audioBuffer], language);

    expect(result).toHaveProperty('text');
    expect(result.text.toLowerCase()).toMatch(/ten.*one/);
    console.log('Transcribed Text:', result.text);
  }, 20000);

  it('should throw for unsupported language', async () => {
    const audioPath = path.join(__dirname, './test-audio.wav');
    const audioBuffer = fs.readFileSync(audioPath);

    await expect(processAudioStream([audioBuffer], 'xx-XX')).rejects.toThrow('Unsupported language');
  });

  it('should throw for empty buffer array', async () => {
    await expect(processAudioStream([], 'en-US')).rejects.toThrow('Invalid or empty audio data');
  });
});
