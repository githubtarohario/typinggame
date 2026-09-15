// タイピング練習用のJavaScriptキーワード/コード集
// 難易度ごとに配列を用意。ここを編集するだけで出題内容を変更できる。

export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

// 難易度ごとの制限時間(秒)
export const DIFFICULTY_TIME_LIMIT: Record<Difficulty, number> = {
  beginner: 60,
  intermediate: 90,
  advanced: 120,
};

export const TYPING_WORDS: Record<Difficulty, string[]> = {
  beginner: [
    "var",
    "let",
    "const",
    "if",
    "else",
    "for",
    "while",
    "function",
    "return",
    "true",
    "false",
    "null",
    "break",
    "continue",
    "typeof",
    "new",
    "this",
    "delete",
    "in",
    "of",
  ],
  intermediate: [
    "async",
    "await",
    "class",
    "extends",
    "import",
    "export",
    "default",
    "try",
    "catch",
    "finally",
    "throw",
    "switch",
    "case",
    "static",
    "get",
    "set",
    "yield",
    "super",
    "instanceof",
    "constructor",
  ],
  advanced: [
    "const sum = (a, b) => a + b;",
    "let arr = [1, 2, 3].map(x => x * 2);",
    "function fetchData() { return fetch(url); }",
    "class Animal { constructor(name) { this.name = name; } }",
    "const { a, b } = obj;",
    "for (const item of items) { console.log(item); }",
    "try { await run(); } catch (e) { console.error(e); }",
    "export default function App() { return null; }",
    "const promise = new Promise((resolve) => resolve(1));",
    "if (a && b || !c) { doSomething(); }",
  ],
};
