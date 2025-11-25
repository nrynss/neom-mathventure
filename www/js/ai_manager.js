import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local model checks since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

export class AIManager {
    constructor() {
        this.pipe = null;
        this.isLoading = false;
        this.isReady = false;
    }

    async initialize() {
        if (this.pipe || this.isLoading) return;

        this.isLoading = true;
        try {
            console.log("Loading Whisper model...");
            this.pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
            this.isReady = true;
            console.log("Whisper model loaded successfully.");
        } catch (error) {
            console.error("Failed to load Whisper model:", error);
        } finally {
            this.isLoading = false;
        }
    }

    async transcribe(audioBlob) {
        if (!this.isReady) {
            console.warn("Model not ready yet.");
            return null;
        }

        try {
            console.log("Starting transcription...");
            // 1. Convert Blob to ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // 2. Decode Audio Data using AudioContext to get raw PCM
            // We use a new context with 16kHz sample rate as required by Whisper
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // 3. Get PCM data (channel 0)
            let audioData = audioBuffer.getChannelData(0);

            console.log(`Audio processed: ${audioData.length} samples at ${audioContext.sampleRate}Hz`);

            // 4. Run Inference
            const output = await this.pipe(audioData);
            console.log("Raw Whisper Output:", output);

            // Close context to free resources
            await audioContext.close();

            return output.text;
        } catch (error) {
            console.error("Transcription failed:", error);
            return null;
        }
    }


    parseNumber(text) {
        if (!text) return null;

        // Remove punctuation and lowercase
        const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

        // Map common number words to digits
        const numberMap = {
            "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
            "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
            "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20
        };

        // Check for digits first
        const digitMatch = cleanText.match(/\d+/);
        if (digitMatch) {
            return parseInt(digitMatch[0]);
        }

        // Check for words
        if (numberMap.hasOwnProperty(cleanText)) {
            return numberMap[cleanText];
        }

        return null;
    }
}
