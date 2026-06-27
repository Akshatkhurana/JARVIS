import { spawn } from "child_process";

function escapeForPowerShellSingleQuoted(text: string): string {
  return text.replace(/'/g, "''");
}

export function speak(text: string) {
  if (process.platform !== "win32") return;

  const safe = escapeForPowerShellSingleQuoted(text);
  spawn(
    "powershell",
    [
      "-Command",
      "Add-Type -AssemblyName System.Speech; "
        + "$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        + `$speak.Speak('${safe}')`,
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  ).unref();
}
