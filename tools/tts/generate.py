#!/usr/bin/env python3
"""Makes the read-aloud audio of the notes: one MP3 per chapter and voice, plus the time of every sentence and word.

Usage (setup in tools/tts/README.md):
    python tools/tts/generate.py                    # every missing chapter, every voice
    python tools/tts/generate.py --voice heart --chapter 9
Input:  tools/tts/scripts/ch-N.json (written by `npm run build`) and tools/tts/voices.json
Output: audio/<voice>/ch-N.<hash>.mp3 and audio/<voice>/ch-N.<hash>.json  ({"d": seconds, "s": [[start, end, [word starts]], ...]})
The hash is the script's hash, so a chapter is only made again when its spoken text changed.
"""
import argparse, json, re, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SR = 24000
GAPS = {"sentence": 0.25, "block": 0.65, "heading": 0.85}
TARGET_DB, PEAK_DB = -20.0, -1.5


def gain_db(x):
    peak = float(np.max(np.abs(x))) or 1e-9
    active = x[np.abs(x) > 0.01]
    if active.size < 100:
        return 0.0
    rms_db = 20 * np.log10(float(np.sqrt(np.mean(active ** 2))))
    return min(TARGET_DB - rms_db, PEAK_DB - 20 * np.log10(peak))


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def align(words, toks):
    """Start time of each displayed word, from the spoken tokens [(text, start, end)]. Words that cannot be matched
    (symbols, numbers read as words) get a time between their neighbours."""
    starts = [None] * len(words)
    j = 0
    for i, w in enumerate(words):
        nw = norm(w)
        if not nw:
            continue
        for k in range(j, min(len(toks), j + 8)):
            acc, m = "", k
            while m < len(toks) and len(acc) < len(nw):
                acc += norm(toks[m][0])
                m += 1
            if acc == nw:
                starts[i] = toks[k][1]
                j = m
                break
    known = [i for i, v in enumerate(starts) if v is not None]
    if not known:
        end = toks[-1][2] if toks else 0.0
        return [end * i / max(1, len(words)) for i in range(len(words))]
    out = list(starts)
    first, last = known[0], known[-1]
    for i in range(first):
        out[i] = starts[first] * i / max(1, first)
    for a, b in zip(known, known[1:]):
        for i in range(a + 1, b):
            out[i] = starts[a] + (starts[b] - starts[a]) * (i - a) / (b - a)
    tail_end = toks[-1][2] if toks else starts[last]
    for i in range(last + 1, len(words)):
        out[i] = starts[last] + max(0.0, tail_end - starts[last]) * (i - last) / (len(words) - last)
    return out


def synth_sentence(pipe, cfg, text):
    """Audio (float32, 24 kHz) of one sentence, trimmed, and its word tokens as [(text, start, end)] from the trimmed start."""
    audio, toks, offset = [], [], 0.0
    for r in pipe(text, voice=cfg["voice"], speed=cfg.get("speed", 1.0)):
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        for t in r.tokens or []:
            if t.start_ts is not None and t.end_ts is not None and norm(t.text):
                toks.append((t.text, offset + float(t.start_ts), offset + float(t.end_ts)))
        audio.append(a)
        offset += len(a) / SR
    x = np.concatenate(audio) if audio else np.zeros(int(0.2 * SR), dtype=np.float32)
    if toks:
        cut_a = max(0.0, toks[0][1] - 0.06)
        cut_b = min(len(x) / SR, toks[-1][2] + 0.12)
        x = x[int(cut_a * SR): int(cut_b * SR)]
        toks = [(t, s - cut_a, e - cut_a) for t, s, e in toks]
    return x, toks


def make_chapter(pipe, cfg, script, out_mp3, out_json, bitrate):
    pieces, timings, t = [np.zeros(int(0.15 * SR), dtype=np.float32)], [], 0.15
    for sent in script["sentences"]:
        x, toks = synth_sentence(pipe, cfg, sent["say"])
        words = sent["text"].split()
        rel = align(words, toks)
        timings.append([round(t, 2), round(t + len(x) / SR, 2), [round(t + v, 2) for v in rel]])
        pieces.append(x)
        gap = np.zeros(int(GAPS[sent["gap"]] * SR), dtype=np.float32)
        pieces.append(gap)
        t += len(x) / SR + len(gap) / SR
    audio = np.concatenate(pieces)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "chapter.wav"
        sf.write(wav, audio, SR)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-af", f"volume={gain_db(audio):.2f}dB", "-ac", "1", "-ar", str(SR), "-b:a", bitrate, str(out_mp3)], check=True)
    out_json.write_text(json.dumps({"d": round(len(audio) / SR, 2), "s": timings}, separators=(",", ":")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="")
    ap.add_argument("--chapter", type=int, default=0)
    ap.add_argument("--bitrate", default="32k")
    args = ap.parse_args()
    voices = json.loads((HERE / "voices.json").read_text())["voices"]
    scripts = sorted((HERE / "scripts").glob("ch-*.json"), key=lambda p: int(p.stem[3:]))
    from kokoro import KPipeline
    for cfg in voices:
        if args.voice and cfg["id"] != args.voice:
            continue
        out = ROOT / "audio" / cfg["id"]
        out.mkdir(parents=True, exist_ok=True)
        pipe = KPipeline(lang_code=cfg["lang_code"], repo_id="hexgrad/Kokoro-82M")
        for path in scripts:
            script = json.loads(path.read_text())
            if args.chapter and script["n"] != args.chapter:
                continue
            mp3, js = out / f"ch-{script['n']}.{script['hash']}.mp3", out / f"ch-{script['n']}.{script['hash']}.json"
            if mp3.exists() and js.exists():
                continue
            print(f"{cfg['id']} chapter {script['n']}: {len(script['sentences'])} sentences", flush=True)
            make_chapter(pipe, cfg, script, mp3, js, args.bitrate)
            for old in out.glob(f"ch-{script['n']}.*"):
                if old.stem.split(".")[1] != script["hash"]:
                    old.unlink()
    print("done", flush=True)


main()
