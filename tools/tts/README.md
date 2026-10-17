# Read-aloud audio

The notes are read by two open-source voices, **Heart** and **Emma** ([Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0), the same ones as in Taalmaatje. One MP3 per chapter and voice, plus a small JSON file with the time of every sentence and word, so the app can highlight what is being read.

1. `npm run build` writes `tools/tts/scripts/ch-N.json` (the spoken text; code, tables, formulas and the answers are skipped).
2. One-time setup (Python 3.12, `ffmpeg` and `espeak-ng`; on a Mac `brew install ffmpeg espeak-ng`):
   `uv venv --python 3.12 .venv-kokoro && source .venv-kokoro/bin/activate && uv pip install kokoro soundfile pip && python -m spacy download en_core_web_sm`
3. Make the audio (only chapters whose text changed are made again):
   `PHONEMIZER_ESPEAK_LIBRARY=/opt/homebrew/lib/libespeak-ng.dylib ESPEAK_DATA_PATH=/opt/homebrew/share/espeak-ng-data python tools/tts/generate.py`
4. `node tools/tts/manifest.mjs` writes `audio/manifest.json` and removes audio whose text has changed.

File names contain the hash of the spoken text, so phones never mix old audio with new text.
