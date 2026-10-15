// タイピング練習用のHTML基本タグ集
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
    "<p>",
    "</p>",
    "<div>",
    "</div>",
    "<span>",
    "</span>",
    "<a>",
    "</a>",
    "<img>",
    "<br>",
    "<hr>",
    "<ul>",
    "<li>",
    "<b>",
    "<i>",
    "<h1>",
    "<h2>",
    "<head>",
    "<body>",
    "<html>",
  ],
  intermediate: [
    "<input>",
    "<button>",
    "<form>",
    "<label>",
    "<select>",
    "<option>",
    "<table>",
    "<thead>",
    "<tbody>",
    "<tr>",
    "<td>",
    "<th>",
    "<section>",
    "<header>",
    "<footer>",
    "<nav>",
    "<article>",
    "<link>",
    "<script>",
    "<style>",
  ],
  advanced: [
    '<a href="https://example.com">link</a>',
    '<img src="photo.jpg" alt="photo">',
    '<input type="text" placeholder="name">',
    '<div class="container"></div>',
    '<form action="/submit" method="post"></form>',
    '<button type="submit">送信</button>',
    '<label for="email">Email</label>',
    '<ul><li>item</li></ul>',
    '<table><tr><td>1</td></tr></table>',
    '<meta charset="utf-8">',
  ],
};
