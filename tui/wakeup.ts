// import {select, isCancel} from "@clack/prompts";
// import chalk from "chalk";
// import figlet from "figlet";

// const Banner_font = 'ANSI Shadow';
// const shadow = chalk.hex('#3054f3');
// const face = chalk.hex('#f3054f').bold

// function printBannerWithShadow(ascii: string) {

//   const bannerLines = ascii.replace(/\s+$/, '').split('\n');
//   const maxLen = Math.max(...bannerLines.map((l) => l.length), 0);
//   const rowWidth = maxLen + 2;

//   for (const line of bannerLines) {
//     console.log(shadow(('  ' + line).padEnd(rowWidth)));
//   }
//   process.stdout.write(`\x1b[${bannerLines.length}A`);
//   for (const line of bannerLines) {
//     console.log(face(line.padEnd(rowWidth)));
//   }
//   console.log();
// }

// export async function runWakeup() {
//     let ascii:string 
//     try {
//         ascii = figlet.textSync('Jarvis', {font: Banner_font});
//     } catch (err) {
//         ascii = figlet.textSync('Jarvis', {font: "Standard"});
//     }
//     printBannerWithShadow(ascii);
// }

import chalk from "chalk";
import figlet from "figlet";
import { select, isCancel } from "@clack/prompts";
import { speak } from "../src/utils/speech";
import { jarvisUserName } from "../src/config/env";
import { runCliMode } from "../modes/cli";
import { runTelegramMode } from "../modes/telegram/index";

export async function runWakeup() {
    let ascii: string;

    try {
        ascii = figlet.textSync("JARVIS", {
            font: "ANSI Shadow",
            horizontalLayout: "default",
        });
    } catch {
        ascii = figlet.textSync("JARVIS");
    }

    const colors = [
        "#00F5FF",
        "#00D9FF",
        "#00BFFF",
        "#5B8CFF",
        "#A855F7",
    ];

    const lines = (ascii ?? "").split("\n");

    console.clear();

    lines.forEach((line, index) => {
        const color = colors[index % colors.length]!;
        console.log(chalk.hex(color).bold(line));
    });

    console.log(
        chalk.hex("#3054f3")(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )
    );

    console.log(
        chalk.hex("#00F5FF").bold("⚡ AI Assistant Initialized")
    );

    console.log(
        chalk.hex("#A855F7")("Ready for commands...\n")
    );
    speak(`Welcome back ${jarvisUserName()}, systems are online. What can I do for you today?`);
    const mode = await select({
        message: "Choose your mode:",
        options: [
            { value: "cli", label: "CLI Mode" },
            { value: "telegram", label: "Telegram Mode" },
            { value: "exit", label: "Exit" },
        ],
    });
    if (isCancel(mode) || mode === "exit") {
        console.log(chalk.red("Exiting..."));
        return;
    }
    if (mode === "cli") {
        console.log(chalk.green("Entering CLI Mode..."));
        speak("Entering CLI Mode.");
        await runCliMode();
    } else if (mode === "telegram") {
        console.log(chalk.green("Entering Telegram Mode..."));
        speak("Entering Telegram Mode.");
        await runTelegramMode();
    }
    else {
        console.log(chalk.red("Exiting..."));
        return;
    }
}