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

4. **Write the commit message** using Conventional Commits format:

   ```
   <type>(<scope>): <short summary in imperative mood>

   <optional body: what changed and why, wrap at 72 chars>
   ```

   **Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`, `perf`, `ci`

   **Scope:** the area affected (e.g., `auth`, `lobby`, `server`, `client`, `db`)

   **Summary rules:**
   - Imperative mood: "add feature" not "added feature"
   - No period at end
   - Under 72 characters
   - Be specific: "implement JWT login API" not "update code"

   **Body (include when):**
   - Multiple unrelated changes exist
   - The *why* is non-obvious
   - Breaking changes (add `BREAKING CHANGE:` footer)

5. **Commit** — run `git commit -m "<message>"` (use `-m` twice if body is needed: `git commit -m "<subject>" -m "<body>"`).

6. **Confirm** — show the commit hash and subject line.

## Examples

| Changes | Message |
|---------|---------|
| Added POST /auth/register endpoint | `feat(auth): implement user registration API` |
| Fixed bug where bot count exceeded 3 | `fix(lobby): cap bot count at 3 per room` |
| Refactored PlayerRepository to use transactions | `refactor(db): use transactions in PlayerRepository` |
| Multiple unrelated changes across auth + lobby | Use body to describe each area |

## Notes

- If the working directory is clean, tell the user there's nothing to commit.
- If there are unstaged changes alongside staged ones, mention it and ask whether to include them.
- Don't include `node_modules/`, `dist/`, `.env` — these should already be gitignored.
