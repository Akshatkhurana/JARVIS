# Jarvis

Jarvis is a local AI assistant CLI built with [Bun](https://bun.sh) and the [Vercel AI SDK](https://sdk.vercel.ai). It can explore and modify your codebase, answer questions, and generate multi-step plans — either from an interactive terminal UI or via a Telegram bot.

The project uses [OpenRouter](https://openrouter.ai) for LLM access and optionally [Firecrawl](https://firecrawl.dev) for web search and scraping.

## Features

| Mode | Description |
|------|-------------|
| **Agent** | Autonomous task execution with file create/modify/delete, shell commands, and skill discovery — all staged until you approve |
| **Ask** | Read-only Q&A over your codebase with optional web research; answers can be saved to Markdown |
| **Plan** | Research-driven step-by-step planning with selective execution |
| **Telegram** | Remote access to Ask, Agent, and Plan via bot commands |

### Tooling

- **File operations** — read, list, search, create, modify, delete (mutations are staged, not applied immediately)
- **Shell execution** — queued and run only after approval
- **Skills** — reads `SKILL.md` files from Cursor/Claude skill directories
- **Web tools** — search, crawl, and fetch URLs (requires Firecrawl API key)
- **Diff review** — interactive approval flow with per-file diffs in CLI mode
- **Text-to-speech** — Windows SAPI greeting on startup (CLI wakeup screen)

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- An [OpenRouter](https://openrouter.ai) API key
- (Optional) [Firecrawl](https://firecrawl.dev) API key for web tools
- (Optional) Telegram bot token and owner chat ID for Telegram mode
- Windows (for built-in TTS; other platforms work without speech)

## Installation

```bash
git clone <your-repo-url>
cd openClaw
bun install
```

## Configuration

Create a `.env` file in the project root (or export these variables in your shell):

```env
# Required
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4

# Optional — enables web_search, web_crawl, fetch_url
FIRECRAWL_API_KEY=fc-...

# Optional — Telegram mode
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_OWNER_ID=your_telegram_chat_id

# Optional — extra skill directories (semicolon-separated on Windows)
SKILLS_DIRS=C:\path\to\skills

# Optional — customize TTS greeting name
JARVIS_USER_NAME=YourName
```

> **Security:** Only the Telegram owner ID configured in `TELEGRAM_OWNER_ID` can interact with the bot. Mutations never hit disk until explicitly approved.

## Usage

### Start Jarvis

```bash
bun run index.ts wakeup
# or, after linking the bin:
jarvis wakeup
```

You will see the startup banner, hear the welcome message (Windows), and choose:

1. **CLI Mode** — interactive sub-menu for Agent, Plan, and Ask
2. **Telegram Mode** — starts the bot and sends a welcome message to the owner

### CLI modes

After selecting **CLI Mode**:

- **Agent Mode** — describe a task; the agent uses tools and presents changes for approval
- **Plan Mode** — describe a goal; Jarvis researches, generates steps, lets you pick which to run
- **Ask Mode** — ask a question; optionally save the answer to a `.md` file

### Telegram commands

| Command | Example |
|---------|---------|
| `/start` | Show welcome message |
| `/ask <question>` | Ask about the codebase |
| `/agent <task>` | Run the coding agent |
| `/plan <goal>` | Generate an interactive plan with inline buttons |

Plan mode in Telegram shows toggle buttons for each step, plus **Select All**, **Deselect All**, and **Proceed**.

## Project structure

```
openClaw/
├── index.ts                 # CLI entry point (jarvis bin)
├── ai/                      # OpenRouter model configuration
├── modes/
│   ├── agent/               # Agent mode: tools, executor, approval, diffs
│   ├── ask/                 # Read-only Q&A orchestrator
│   ├── plan/                # Planner, step selection, web tools
│   ├── telegram/            # Telegraf bot handlers and sessions
│   └── cli.ts               # CLI sub-mode menu
├── tui/                     # Terminal UI (banner, markdown rendering)
└── src/utils/speech.ts      # Windows TTS helper
```

### Architecture overview

```
                    ┌─────────────┐
                    │   wakeup    │
                    └──────┬──────┘
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐            ┌─────────────┐
        │ CLI Mode │            │  Telegram   │
        └────┬─────┘            └──────┬──────┘
             │                         │
    ┌────────┼────────┐         ┌──────┴──────┐
    ▼        ▼        ▼         ▼      ▼      ▼
 Agent     Plan      Ask      /ask  /agent  /plan
    │        │        │         │      │      │
    └────────┴────────┴─────────┴──────┴──────┘
                      │
              ┌───────▼────────┐
              │  ToolExecutor  │  ← stages mutations
              │ ActionTracker  │  ← logs all actions
              └───────┬────────┘
                      ▼
              ┌───────────────┐
              │ Approval flow │  ← CLI diff review / Telegram buttons
              └───────────────┘
```

## How approval works

1. The agent calls tools (create/modify/delete files, shell, etc.).
2. Mutations are recorded in `ActionTracker` with status `pending`.
3. After the agent finishes, you review staged changes:
   - **CLI:** approve all, review one-by-one with diffs, or cancel
   - **Telegram:** Accept All / Reject All / Show Diff (when enabled)
4. Approved changes are written to disk via `ToolExecutor.applyApprovedFromTracker()`.

Read-only operations (file reads, web search, codebase analysis) execute immediately and are not staged.

## Development

```bash
# Run directly
bun run index.ts wakeup

# Type-check (via Bun/TS)
bunx tsc --noEmit
```

### Key dependencies

- `ai` + `@openrouter/ai-sdk-provider` — LLM agent loop
- `@clack/prompts` — interactive CLI prompts
- `telegraf` — Telegram bot
- `@mendable/firecrawl-js` — web search/crawl
- `marked` + `marked-terminal` — terminal Markdown rendering
- `diff` — unified diff for change review

## Known limitations

- **Windows-centric TTS** — speech uses PowerShell `System.Speech`; Linux/macOS users get silent startup
- **Single workspace** — defaults to `process.cwd()`; no CLI flag yet to target another directory
- **Full-file replacements** — `modify_file` replaces entire file contents (no patch/diff-based edits)
- **Shell safety** — approved shell commands run with `shell: true` in the workspace; use with care
- **Telegram approval** — agent and plan runs in Telegram now prompt for file-change approval via inline buttons

## License

Private project — see repository owner for terms.
