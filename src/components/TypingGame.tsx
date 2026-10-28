"use client";

import { useState, useEffect, useRef } from "react";
import {
  Difficulty,
  DIFFICULTY_LABELS,
  DIFFICULTY_TIME_LIMIT,
  TYPING_WORDS,
} from "@/data/typing-words";
import Keyboard from "@/components/Keyboard";

type GameState = "select" | "playing" | "finished";

const DIFFICULTY_STYLES: Record<
  Difficulty,
  { icon: string; gradient: string; description: string }
> = {
  beginner: {
    icon: "🌱",
    gradient: "from-emerald-400 to-emerald-600",
    description: "基本タグを1つずつ練習",
  },
  intermediate: {
    icon: "🔥",
    gradient: "from-sky-400 to-sky-600",
    description: "フォーム・テーブル系タグ",
  },
  advanced: {
    icon: "⚡",
    gradient: "from-violet-400 to-violet-600",
    description: "属性つきの実用コード",
  },
};

function pickWord(difficulty: Difficulty, exclude?: string): string {
  const words = TYPING_WORDS[difficulty];
  let word = words[Math.floor(Math.random() * words.length)];
  if (words.length > 1) {
    while (word === exclude) {
      word = words[Math.floor(Math.random() * words.length)];
    }
  }
  return word;
}

// IMEで確定された全角英数・記号を半角に揃える(「＜」→「<」など)
function normalizeInput(text: string): string {
  return text
    .replace(/[！-～]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/　/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function isAscii(ch: string | null): boolean {
  return ch !== null && ch.charCodeAt(0) < 0x80;
}

function getResultMessage(accuracy: number, wordsCompleted: number): string {
  if (wordsCompleted === 0) {
    return "まずは1つクリアしてみよう!落ち着いて入力してみてください";
  }
  if (accuracy >= 95) return "パーフェクト!素晴らしい正確さです!";
  if (accuracy >= 85) return "よくできました!その調子で続けよう!";
  if (accuracy >= 70) return "なかなかいい調子!もう少しで完璧!";
  if (accuracy >= 50) return "がんばろう!練習を続ければ上達します";
  return "まずは正確さを意識してゆっくり入力してみよう";
}

export default function TypingGame() {
  const [state, setState] = useState<GameState>("select");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [currentWord, setCurrentWord] = useState("");
  const [typedLength, setTypedLength] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imeWarning, setImeWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  // 1回のイベントで複数文字が確定されることがあるため、最新値はrefでも持つ
  const currentWordRef = useRef("");
  const typedLengthRef = useRef(0);
  const composingRef = useRef(false);

  useEffect(() => {
    if (state !== "playing" || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          setState("finished");
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, timeLeft]);

  useEffect(() => {
    if (state === "playing") {
      inputRef.current?.focus();
    }
  }, [state, currentWord]);

  useEffect(() => {
    if (state === "playing") {
      startTimeRef.current = Date.now();
    }
  }, [state]);

  function startGame(level: Difficulty) {
    const word = pickWord(level);
    currentWordRef.current = word;
    typedLengthRef.current = 0;
    composingRef.current = false;
    setDifficulty(level);
    setCurrentWord(word);
    setTypedLength(0);
    setCorrectCount(0);
    setMissCount(0);
    setWordsCompleted(0);
    setTimeLeft(DIFFICULTY_TIME_LIMIT[level]);
    setSaveError(null);
    setImeWarning(false);
    setState("playing");
  }

  // 入力された文字を1文字ずつ判定する。ミス入力は反映しない(お手つき防止)
  function processChars(text: string) {
    let word = currentWordRef.current;
    let pos = typedLengthRef.current;
    let correct = 0;
    let miss = 0;
    let completed = 0;

    for (const ch of normalizeInput(text)) {
      if (ch !== word[pos]) {
        miss++;
        continue;
      }
      correct++;
      pos++;
      if (pos === word.length) {
        completed++;
        word = pickWord(difficulty, word);
        pos = 0;
      }
    }

    currentWordRef.current = word;
    typedLengthRef.current = pos;
    setCurrentWord(word);
    setTypedLength(pos);
    if (correct) setCorrectCount((c) => c + correct);
    if (miss) setMissCount((m) => m + miss);
    if (completed) setWordsCompleted((w) => w + completed);
  }

  // 入力欄に確定済みの文字を取り出して判定する。取り出したら空にするので、
  // ブラウザごとにcompositionend/inputの順序が違っても二重判定にならない
  function flushInput() {
    const el = inputRef.current;
    if (!el || composingRef.current || el.value === "") return;
    const text = el.value;
    el.value = "";
    processChars(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // IME変換中のキーはここでは扱わず、確定後にflushInputで判定する
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    // 文字キー以外(Shift, Backspace, 矢印キー等)は無視
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();
    setImeWarning(false);
    processChars(e.key);
  }

  function handleCompositionStart() {
    composingRef.current = true;
    // 英数記号を打つ場面で日本語入力がONになっていたら案内を出す
    if (isAscii(currentWordRef.current[typedLengthRef.current] ?? null)) {
      setImeWarning(true);
    }
  }

  function handleCompositionEnd() {
    composingRef.current = false;
    // 確定文字が入力欄に反映されてから取り出す
    setTimeout(flushInput, 0);
  }

  function refocusInput() {
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (state !== "finished") return;
    const elapsedMinutes = Math.max(
      (Date.now() - startTimeRef.current) / 1000 / 60,
      1 / 60,
    );
    const wpm = Math.round(wordsCompleted / elapsedMinutes);
    const totalKeys = correctCount + missCount;
    const accuracy =
      totalKeys === 0 ? 100 : Math.round((correctCount / totalKeys) * 1000) / 10;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaving(true);
    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        difficulty,
        accuracy,
        wpm,
        correctCount,
        missCount,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setSaveError(data.error ?? "スコアの保存に失敗しました");
        }
      })
      .catch(() => setSaveError("スコアの保存に失敗しました"))
      .finally(() => setSaving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const totalKeys = correctCount + missCount;
  const accuracy =
    totalKeys === 0 ? 100 : Math.round((correctCount / totalKeys) * 1000) / 10;

  if (state === "select") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            HTML Typing Practice
          </p>
          <h1 className="text-3xl font-bold text-slate-800">
            難易度を選択してください
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            タグを正確に、できるだけ早くタイピングしよう
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => {
            const style = DIFFICULTY_STYLES[level];
            return (
              <button
                key={level}
                onClick={() => startGame(level)}
                className="group flex w-44 flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${style.gradient} text-2xl shadow-md transition-transform group-hover:scale-110`}
                >
                  {style.icon}
                </span>
                <span className="mt-1 text-lg font-bold text-slate-800">
                  {DIFFICULTY_LABELS[level]}
                </span>
                <span className="text-xs text-slate-500">
                  {style.description}
                </span>
                <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  制限時間 {DIFFICULTY_TIME_LIMIT[level]}秒
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (state === "finished") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-slate-800">結果</h1>
        <p className="text-center text-lg font-semibold text-emerald-600">
          {getResultMessage(accuracy, wordsCompleted)}
        </p>
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-slate-500">難易度</dt>
            <dd className="text-right font-semibold">
              {DIFFICULTY_LABELS[difficulty]}
            </dd>
            <dt className="text-slate-500">正解数</dt>
            <dd className="text-right font-semibold">{correctCount}</dd>
            <dt className="text-slate-500">ミス数</dt>
            <dd className="text-right font-semibold">{missCount}</dd>
            <dt className="text-slate-500">正解率</dt>
            <dd className="text-right font-semibold">{accuracy}%</dd>
            <dt className="text-slate-500">完了ワード数</dt>
            <dd className="text-right font-semibold">{wordsCompleted}</dd>
          </dl>
          {saving && (
            <p className="mt-3 text-center text-xs text-slate-400">
              保存中...
            </p>
          )}
          {saveError && (
            <p className="mt-3 text-center text-xs text-red-600">
              {saveError}
            </p>
          )}
        </div>
        <button
          onClick={() => setState("select")}
          className="rounded bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          もう一度プレイ
        </button>
      </div>
    );
  }

  const nextChar = currentWord[typedLength] ?? null;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-8 px-4"
      onClick={refocusInput}
    >
      <div className="flex w-full max-w-2xl items-center justify-between text-sm text-slate-500">
        <span>難易度: {DIFFICULTY_LABELS[difficulty]}</span>
        <span>残り時間: {timeLeft}秒</span>
        <span>正解率: {accuracy}%</span>
      </div>

      <div className="text-center">
        <p className="font-mono text-4xl tracking-wide">
          {currentWord.split("").map((ch, i) => (
            <span
              key={i}
              className={
                i < typedLength
                  ? "text-emerald-600"
                  : i === typedLength
                    ? "bg-emerald-100 text-slate-800"
                    : "text-slate-400"
              }
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
      </div>

      {nextChar !== null && !isAscii(nextChar) ? (
        <p className="rounded bg-sky-50 px-4 py-2 text-sm text-sky-700">
          日本語入力をONにして「{currentWord.slice(typedLength).match(/^[^\x00-\x7F]+/)?.[0]}」と入力し、Enterで確定してください
        </p>
      ) : (
        imeWarning && (
          <p className="rounded bg-amber-50 px-4 py-2 text-sm text-amber-700">
            日本語入力がONになっています。半角英数に切り替えてください(半角/全角キー)
          </p>
        )
      )}

      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        onKeyDown={handleKeyDown}
        onInput={flushInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={refocusInput}
        className="absolute h-0 w-0 opacity-0"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <Keyboard nextChar={nextChar} />
    </div>
  );
}
