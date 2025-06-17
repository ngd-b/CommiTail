import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

interface Config {
  appendOptions: string[];
  defaultIndex?: number;
  manual?: boolean;
}

function getGitExtension() {
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (!gitExtension) return null;
  return gitExtension.exports.getAPI(1);
}

function getWorkspaceConfigPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, "commitail.config.json");
}

function loadConfig(): Config | null {
  const configPath = getWorkspaceConfigPath();
  if (!configPath) return null;
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content) as Config;
  } catch {
    return null;
  }
}

function execGitCommit(message: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 先检查是否有暂存变更
    exec(`git diff --cached --quiet`, { cwd }, (err) => {
      if (err) {
        // 有变更，执行提交
        exec(
          `git commit -m "${message.replace(/"/g, '\\"')}"`,
          { cwd },
          (err2, stdout, stderr) => {
            if (err2) {
              vscode.window.showErrorMessage(
                `Git commit failed: ${stderr || err2.message}`
              );
              reject(err2);
            } else {
              vscode.window.showInformationMessage(
                `Git commit success: ${message}`
              );
              resolve();
            }
          }
        );
      } else {
        // 没有暂存变更
        vscode.window.showWarningMessage(
          "No staged changes to commit. Please stage your changes first."
        );
        reject(new Error("No staged changes"));
      }
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "commitail.commitWithAppend",
    async () => {
      const git = getGitExtension();
      if (!git) {
        vscode.window.showErrorMessage("Git extension not found");
        return;
      }
      const repo = git.repositories[0];
      if (!repo) {
        vscode.window.showErrorMessage("No Git repository found");
        return;
      }

      const inputBox = repo.inputBox;
      const originalMessage = inputBox.value.trim();

      if (!originalMessage) {
        vscode.window.showWarningMessage("Please enter commit message first");
        return;
      }

      const config = loadConfig();
      if (
        !config ||
        !config.appendOptions ||
        config.appendOptions.length === 0
      ) {
        vscode.window.showWarningMessage(
          "No append options found in commitail.config.json"
        );
        return;
      }

      let selectedSuffix: string | undefined;

      // manual=false 表示不弹选择框，使用 defaultIndex
      if (config.manual === false) {
        // 默认索引为 0，如果未设置
        const index =
          typeof config.defaultIndex === "number" ? config.defaultIndex : 0;

        if (index < 0 || index >= config.appendOptions.length) {
          vscode.window.showErrorMessage(
            `defaultIndex ${index} is out of range.`
          );
          return;
        }

        selectedSuffix = config.appendOptions[index];
      } else {
        selectedSuffix = await vscode.window.showQuickPick(
          config.appendOptions,
          {
            placeHolder: "Select commit message suffix to append",
            canPickMany: false,
          }
        );

        if (selectedSuffix === undefined) {
          return; // 用户取消选择
        }
      }

      const finalMessage = `${originalMessage} ${selectedSuffix}`;

      try {
        await execGitCommit(finalMessage, repo.rootUri.fsPath);
        inputBox.value = "";
        await repo.status();
      } catch {
        // 失败时不清空输入框
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
