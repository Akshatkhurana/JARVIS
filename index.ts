#!/usr/bin/env bun
import {Command} from 'commander';
import { runWakeup } from './tui/wakeup';
import { spawn } from "child_process";

const player = require("play-sound") as any;

export function speak(text: string) {
    spawn("powershell", [
        "-Command",
        `Add-Type -AssemblyName System.Speech; `
        + `$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; `
        + `$speak.Speak('${text}')`
    ]);
}
const program = new Command();
program.name('jarvis').description('A CLI tool for Jarvis').version('1.0.0');

program
.command("wakeup")
.description("Show me the banner and pick CLI or Telegram mode")
.action(async () => {
    await runWakeup();
});
await program.parseAsync(process.argv);