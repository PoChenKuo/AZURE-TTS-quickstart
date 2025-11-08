import dotenv from "dotenv";
import { SpeechConfig, AudioConfig, SpeechSynthesizer, ResultReason } from "microsoft-cognitiveservices-speech-sdk";
dotenv.config();
const {SPEECH_KEY, ENDPOINT } = process.env;
function synthesizeSpeech() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node src/synthesis.js <output-audio-file> <text-to-synthesize>");
        process.exit(1);
    }
    const audioFile = args[0].trim();
    const text = args.slice(1).join(" ").trim();
    if (!audioFile || !text) {
        console.error("Usage: node src/synthesis.js <output-audio-file> <text-to-synthesize>");
        process.exit(1);
    }
    // This example requires environment variables named "ENDPOINT" and "SPEECH_KEY"
    const speechConfig = SpeechConfig.fromEndpoint(new URL(ENDPOINT), SPEECH_KEY);
    const audioConfig = AudioConfig.fromAudioFileOutput(audioFile);
    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "zh-TW-HsiaoChenNeural";
    // Create the speech synthesizer.
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    // Start the synthesizer and wait for a result.
    synthesizer.speakTextAsync(text, function (result) {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            console.log("synthesis finished.");
        }
        else {
            console.error("Speech synthesis canceled, " + result.errorDetails +
                "\nDid you set the speech resource key and region values?");
        }
        synthesizer.close();
    }, function (err) {
        console.trace("err - " + err);
        synthesizer.close();
    });
    console.log("Now synthesizing to: " + audioFile);
}
synthesizeSpeech();
