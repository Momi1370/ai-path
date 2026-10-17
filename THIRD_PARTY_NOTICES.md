# Third-party notices

## ts-fsrs 5.4.2 (vendor/ts-fsrs.mjs)

Source: https://github.com/open-spaced-repetition/ts-fsrs

```
MIT License

Copyright (c) 2026 Open Spaced Repetition

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Build tools (not shipped)

[marked](https://github.com/markedjs/marked) (MIT) and [KaTeX](https://github.com/KaTeX/KaTeX) (MIT) turn the notes into the content files. The app ships only their output (HTML and MathML).

## Voices (audio/)

The read-aloud audio is generated with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad (Apache-2.0), voices `af_heart` (Heart) and `bf_emma` (Emma), with [misaki](https://github.com/hexgrad/misaki) for pronunciation. The models are not shipped, only the audio they made.
