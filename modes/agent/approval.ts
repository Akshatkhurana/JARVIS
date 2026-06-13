import type { ActionTracker } from "./action-tracker";
import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import type { ActionLog } from "./types.ts";
import { formatPatch, composeBeforeAfter } from "./diff-view";
import { renderTerminalMarkdown } from "../../tui/terminal-md";

interface ReviewGroup {
    label: string;
    actionIds: string[],
    patch: string | null;
}

function groupPending(pending: ActionLog[]): ReviewGroup[] {
  const byPath = new Map<string, ActionLog[]>();
  const shells: ActionLog[] = [];

  for (const a of pending) {
    if (a.type === "tool_execute") {
      shells.push(a);
      continue;
    }
    const key = a.path;
    if (!byPath.has(key)) byPath.set(key, []);
    byPath.get(key)!.push(a);
  }

  const groups: ReviewGroup[] = [];

  const pathEntries = [...byPath.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [p, acts] of pathEntries) {
    const sorted = acts.sort(
      (x, y) => x.timestamp.getTime() - y.timestamp.getTime(),
    );
    const ids = sorted.map((x) => x.id);

    if (sorted.every((x) => x.type === "folder_create")) {
      groups.push({
        label: `Create folder: ${p}`,
        actionIds: ids,
        patch: null,
      });
      continue;
    }

    const { before, after } = composeBeforeAfter(sorted);
    const patch = formatPatch(p, before, after);
    const kinds = [...new Set(sorted.map((x) => x.type))].join(", ");
    groups.push({ label: `${p} (${kinds})`, actionIds: ids, patch });
  }

  for (const s of shells) {
    groups.push({
      label: `Shell: ${s.details.command ?? "(no command)"}`,
      actionIds: [s.id],
      patch: null,
    });
  }

  return groups;
}

export async function runApprovvalFlow(tracker: ActionTracker): Promise<boolean> {
    const pending = tracker.getPendingMutations();
    if (pending.length === 0) {
        console.log(chalk.bold.green("\nNo pending changes to review. Exiting approval flow.\n"));
        return false;
    }
    const choice = await select({
        message: "Review and approve the proposed changes:",
        options: [
            { value: "all", label: "Approve and apply all changes" },
            { value: "select", label: "Review one by one" },
            { value: "cancel", label: "Cancel" }
        ]
    });
    if (isCancel(choice) || choice === "cancel") {
        for(const action of pending) {
            tracker.updateStatus(action.id, "rejected", false);
            return false;
        }
    }
    if (choice === "all") {
        for(const action of pending) {
            tracker.updateStatus(action.id, "approved", true);
        }
        return true;
    }
    for(const group of groupPending(pending)) {
      while(true) {
        const opt = await select({
          message: chalk.bold(group.label),
          options: [
            {value: "accept", label: "Accept"},
            {value: "diff", label: "Show diff", hint: group.patch ? "" : "N/A"},
            {value: "reject", label: "Reject"}
          ]
        });
        if(isCancel(opt)) {
          for(const a of pending) {
            tracker.updateStatus(a.id, 'rejected', false);
          }
          return false;
        }
        if(opt == "diff") {
          if(group.patch) {
            console.log(
              '\n' + renderTerminalMarkdown('```diff\n' + group.patch + '\n```\n') + '\n'
            );
          }
          continue;
        }
        for(const id of group.actionIds) {
          tracker.updateStatus(
            id, 
            opt === "accept" ? "approved" : "rejected",
            opt === "accept",
          );
        }
        break;
      }
    }
    return tracker.getActions().some((a) => a.status === "approved");
}
