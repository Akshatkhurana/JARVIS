import chalk from "chalk";
import { text, isCancel } from "@clack/prompts";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracker";
import { ToolExecutor } from "./tool-executor";
import { createAgentTools } from "./agent-tools";
import { ToolLoopAgent, stepCountIs } from "ai";
import { getAgentModel } from "../../ai";
import { renderTerminalMarkdown } from "../../tui/terminal-md";

export async function runAgentMode() {
    console.log(chalk.bold.green("\n🤖 Entering Agent Mode...\n"));
    const goal = await text({
        message: "What would you like me to work on?",
        placeholder: "E.g., 'Find the best laptops under ₹80,000 and compare them'"
    });
    if (!goal || isCancel(goal)) return;

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);
    const tools = createAgentTools(executor);

    const agent = new ToolLoopAgent({
        model: getAgentModel(),
        stopWhen: stepCountIs(30),
        instructions: [
            'Workspace root: ${config.codebasePath}',
            `All mutations are staged until approval.`,
        ].join("\n"),
        tools,
    });
    const result = await agent.generate({
        prompt: goal.trim(),
        onStepFinish: ({ toolCalls }) => {
            if (toolCalls.length === 0) return;
            for (const call of toolCalls) {
                const preview = JSON.stringify(call.input).slice(0, 160);
                console.log(chalk.bold.blue(`\n ${chalk.green('✓')} Tool called: ${String(call.toolName)}`));
                console.log(chalk.dim(preview + (preview.length >= 160 ? "..." : "")));
            }
        }
    }
    );
    if(result.text?.trim()) {
        console.log(renderTerminalMarkdown(result.text));
    }

    const ok = await runApprovvalFlow(tracker);
    if (!ok) return executor.clearStaging();

    const errors = executor.applyApprovedFromTracker().errors;
    if (errors.length > 0) {
        console.log(chalk.bold.red("\nThe following errors occurred while applying the approved changes:\n"));
        errors.forEach((error) => console.log(chalk.red(`- ${error}`)));
    }
    else {
        console.log(chalk.bold.green("\nAll approved changes have been successfully applied!\n"));
    }
    executor.clearStaging();
}