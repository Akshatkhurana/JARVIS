export function requireOpenRouterEnv(): void {
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env file or environment.",
    );
  }
  if (!process.env.OPENROUTER_DEFAULT_MODEL?.trim()) {
    throw new Error(
      "OPENROUTER_DEFAULT_MODEL is not set. Add it to your .env file or environment.",
    );
  }
}

export function requireTelegramEnv(): void {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Add it to your .env file or environment.",
    );
  }
  if (!process.env.TELEGRAM_OWNER_ID?.trim()) {
    throw new Error(
      "TELEGRAM_OWNER_ID is not set. Add it to your .env file or environment.",
    );
  }
}

export function jarvisUserName(): string {
  return process.env.JARVIS_USER_NAME?.trim() || "there";
}
