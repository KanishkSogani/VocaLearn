// worklet.js
class PCMEncoderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0][0]; // mono
    if (!input) return true;

    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(i * 2, s, true);
    }

    this.port.postMessage(buffer);
    return true;
  }
}

registerProcessor('pcm-encoder', PCMEncoderProcessor);
