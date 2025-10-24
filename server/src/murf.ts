import axios from "axios";
import { config } from "./utils/config";
import { WebSocket } from "ws";
import { getVoiceId } from "./utils/languages";


export const generateAndSendTTS = async (
  clientSocket: WebSocket,
  text: string,
  language: string,
  label: "correction" | "explanation" = "correction"
): Promise<string> => {
  try {
    const voice_Id = getVoiceId(language)
    const data1 = {
        text : text,
        voice_id: voice_Id,
        sample_rate: 44100,
        channel_type: "MONO",
        format: "WAV",
        style: "Conversational",
        rate: 0,
        pitch: 0,
        variation: 1,
      }
    const res = await axios.post(
      "https://api.murf.ai/v1/speech/generate", data1,
      {
        headers: {
          "api-key": config.murfApiKey,
          "Content-Type": "application/json",
        },
      }
    );

   const { audioFile } = res.data;

    if (!audioFile) {
      throw new Error("No audio URL returned from Murf");
    }

    console.log(" Sending audio URL to client:", audioFile);

    clientSocket.send(
      JSON.stringify({
        type: "audio",
        audioUrl: audioFile, 
        label,
        isFinal: true,
      })
    );
    return audioFile;
  } catch (err: any) {
    console.error(" Murf HTTP TTS failed:", err.message);
    clientSocket.send(JSON.stringify({ error: `TTS Error: ${err.message}` }));
    return "";
  }
};