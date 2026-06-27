#!/usr/bin/env bun
import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command();
program.name("jarvis").description("A CLI tool for Jarvis").version("1.0.0");

program
  .command("wakeup")
  .description("Show me the banner and pick CLI or Telegram mode")
  .action(async () => {
    await runWakeup();
  });

await program.parseAsync(process.argv);
