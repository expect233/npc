# AI NPC 酒館 Demo

這是一個「遊戲裡正確接 AI API」的最小範例。

- WASD / 方向鍵移動
- 靠近酒館老闆後按 E 對話
- AI NPC 會收到玩家任務、地點與最近對話
- 可切換 OpenAI / Google Gemini
- API Key 不放在前端
- 使用 Cloudflare Pages Functions 當後端代理

## Cloudflare 設定

在 Pages 專案的 Variables / Secrets 設定：

```text
OPENAI_API_KEY = 你的 OpenAI Key
GEMINI_API_KEY = 你的 Google Gemini Key
```

請用 Secret / encrypted variable。只想用一個供應商也可以，只設定其中一個。

## 本機測試

在專案根目錄建立 `.dev.vars`：

```text
OPENAI_API_KEY=你的OpenAIKey
GEMINI_API_KEY=你的GeminiKey
```

然後執行：

```bash
npx wrangler pages dev .
```

不要直接雙擊 index.html，因為 `/api/npc` 需要 Pages Functions。

## 目前模型

- OpenAI：`gpt-5.6-luna`
- Gemini：`gemini-3.8-flash`

## 為什麼 Key 不能放遊戲前端？

瀏覽器遊戲、Unity WebGL、APK、EXE 或 JavaScript 都可能被檢查、攔封包或反編譯。正式架構應是：

```text
玩家遊戲
   ↓
你的 /api/npc
   ↓
Cloudflare Secret
   ↓
OpenAI / Gemini
```

正式上線前還要加登入、rate limit、每日額度、輸入長度限制，以及由伺服器驗證真正遊戲狀態。
