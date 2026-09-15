const ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const SPECIAL_KEY_LABELS: Record<string, string> = {
  " ": "space",
  "(": "(",
  ")": ")",
  "{": "{",
  "}": "}",
  ";": ";",
  "=": "=",
  ",": ",",
  ".": ".",
  "'": "'",
  '"': '"',
  ">": ">",
  "<": "<",
  "!": "!",
  "&": "&",
  "|": "|",
};

export default function Keyboard({ nextChar }: { nextChar: string | null }) {
  const target = nextChar?.toLowerCase() ?? null;
  const isSpace = target === " ";

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-1.5 select-none">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          {row.map((key) => {
            const active = target === key;
            return (
              <div
                key={key}
                className={`flex h-9 w-9 items-center justify-center rounded text-xs font-mono uppercase transition-colors ${
                  active
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
      <div
        className={`mt-1 flex h-9 w-64 items-center justify-center rounded text-xs font-mono transition-colors ${
          isSpace
            ? "bg-emerald-500 text-white shadow-md"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        space
      </div>
      {target && !isSpace && !ROWS.some((row) => row.includes(target)) && (
        <p className="mt-1 text-xs text-slate-400">
          次のキー: {SPECIAL_KEY_LABELS[target] ?? nextChar}
        </p>
      )}
    </div>
  );
}
