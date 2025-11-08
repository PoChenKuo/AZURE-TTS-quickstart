# Synthesis Quickstart

Minimal Node.js sample that uses the Microsoft Cognitive Services Speech SDK to synthesize text into an audio file.

## Prerequisites

- Node.js 18+
- Azure AI Foundry (Speech service) resource with a valid `SPEECH_KEY` and custom `ENDPOINT`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. In Azure AI Foundry, provision a Speech resource and gather the corresponding endpoint/key/region, then create a `.env` file in the project root with:
   ```ini
   SPEECH_KEY=<your-speech-key>
   ENDPOINT=<https-endpoint-from-azure>
   SPEECH_REGION=<azure-region-of-your-speech-resource>
   ```

## Usage

Supply the output WAV filename followed by the text you want to synthesize:

```bash
node synthesis.js output.wav "Hello from the Speech SDK"
```

The synthesized audio is written to `output.wav` (or whichever filename you specify). Any missing arguments will cause the script to print the usage guidance and exit.

## Voice Selection

The sample defaults to the `zh-TW-HsiaoChenNeural` voice. You can change `speechConfig.speechSynthesisVoiceName` in `synthesis.js` to any supported Azure AI Foundry speech voice. See the catalog at https://learn.microsoft.com/en-us/azure/ai-services/speech-service/openai-voices for available options and IDs.
