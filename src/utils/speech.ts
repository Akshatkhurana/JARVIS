import { spawn } from "child_process";

export function speak(text: string) {
    spawn(
        "powershell",
        [
            "-Command",
            `Add-Type -AssemblyName System.Speech; `
            + `$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; `
            + `$speak.Rate = 1; `
            + `$speak.Speak('${text}')`
        ],
        {
            detached: true,
            stdio: "ignore"
        }
    ).unref();
}