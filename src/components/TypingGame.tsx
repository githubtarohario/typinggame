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
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

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
    setDifficulty(level);
    setCurrentWord(pickWord(level));
    setTypedLength(0);
    setCorrectCount(0);
    setMissCount(0);
    setWordsCompleted(0);
    setTimeLeft(DIFFICULTY_TIME_LIMIT[level]);
    setSaveError(null);
    setState("playing");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const expectedChar = currentWord[value.length - 1];
    const typedChar = value[value.length - 1];

    if (value.length > typedLength) {
      if (typedChar === expectedChar) {
        setCorrectCount((c) => c + 1);
      } else {
        setMissCount((m) => m + 1);
        return; // ミス入力は反映しない(お手つき防止)
      }
    }

    setTypedLength(value.length);

    if (value === currentWord) {
      setWordsCompleted((w) => w + 1);
      setCurrentWord(pickWord(difficulty, currentWord));
      setTypedLength(0);
      if (inputRef.current) inputRef.current.value = "";
    }
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
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold text-slate-800">
          難易度を選択してください
        </h1>
        <div className="flex gap-4">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => startGame(level)}
              className="flex w-36 flex-col items-center gap-1 rounded-lg border border-slate-300 bg-white px-6 py-5 shadow-sm hover:border-slate-500 hover:shadow-md"
            >
              <span className="text-lg font-bold text-slate-800">
                {DIFFICULTY_LABELS[level]}
              </span>
              <span className="text-xs text-slate-500">
                制限時間 {DIFFICULTY_TIME_LIMIT[level]}秒
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state === "finished") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-slate-800">結果</h1>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
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

      <input
        ref={inputRef}
        type="text"
        value={currentWord.slice(0, typedLength)}
        onChange={handleChange}
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
