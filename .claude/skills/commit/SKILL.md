---
name: commit
description: Stage all changes and create a meaningful git commit. Use this skill whenever the user says "commit", "/commit", "幫我 commit", "提交", "存檔", or asks to save/record their current changes to git. Also trigger when user says things like "commit this", "save progress", "記錄進度", even if they don't explicitly say git.
---

# Git Commit Skill

Create a well-structured git commit from the current working changes.

## Steps

1. **Check status** — run `git status --short` and `git diff --stat HEAD` to understand what changed.

2. **Stage changes** — if nothing is staged (`git diff --cached --quiet`), run `git add -A` to stage everything. If the user specified files, stage only those.

3. **Analyze the diff** — run `git diff --cached --stat` and `git diff --cached` (limit to ~200 lines if very large) to understand *what* changed and *why*.

4. **Write the commit message** using Conventional Commits format with **繁體中文**：

   ```
   <type>(<scope>): <中文簡短摘要>

   <選用 body：說明改了什麼、為什麼，每行不超過 72 字元>
   ```

   **Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`, `perf`, `ci`

   **Scope:** 受影響的範圍（如 `auth`, `lobby`, `server`, `client`, `db`）

   **摘要規則：**
   - 祈使句動詞開頭：「新增」「修正」「重構」，不要「新增了」「已修正」
   - 不加句號
   - 繁體中文，72 字元以內
   - 要具體：「新增 JWT 登入 API」而非「更新程式碼」

   **加 body 的時機：**
   - 多個不相關的變更
   - 原因不明顯
   - 有 breaking change（加 `BREAKING CHANGE:` footer）

5. **Commit** — run `git commit -m "<message>"` (use `-m` twice if body is needed: `git commit -m "<subject>" -m "<body>"`).

6. **Confirm** — show the commit hash and subject line.

## Examples

| 變更內容 | 訊息 |
|---------|------|
| 新增 POST /auth/register | `feat(auth): 新增使用者註冊 API` |
| 修正 bot 數量超過 3 的 bug | `fix(lobby): 修正 Bot 數量上限未正確限制為 3` |
| 重構 PlayerRepository | `refactor(db): 改用 transaction 重構 PlayerRepository` |
| 多處修改 | 用 body 分別說明各範圍 |

## Notes

- If the working directory is clean, tell the user there's nothing to commit.
- If there are unstaged changes alongside staged ones, mention it and ask whether to include them.
- Don't include `node_modules/`, `dist/`, `.env` — these should already be gitignored.
