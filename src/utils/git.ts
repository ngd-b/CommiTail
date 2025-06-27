import * as vscode from "vscode";
import { exec } from "child_process";
import * as nls from "vscode-nls";
import { GitRepository } from "../types";
import { Logger } from "./logger";

const localize = nls.loadMessageBundle();

export function getGitExtension() {
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (!gitExtension) {
    Logger.warn("Git extension not found");
    return null;
  }
  return gitExtension.exports.getAPI(1);
}

export function execGitCommit(
  repository: GitRepository,
  message: string
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    // 检查是否有暂存变更
    if (!repository.state.indexChanges.length) {
      Logger.warn("No staged changes found");
      vscode.window.showErrorMessage(
        localize(
          "extension.noStagedChanges",
          "没有暂存的更改，请先暂存您的更改"
        )
      );
      return resolve(false);
    }

    // 执行提交
    const command = `git commit -m "${message.replace(/"/g, '"')}"`;
    Logger.info(`Executing git commit: ${command}`);

    exec(command, { cwd: repository.rootUri.fsPath }, (err, stdout, stderr) => {
      if (err) {
        // 提交失败
        Logger.error(`Git commit failed: ${stderr || err.message}`, err);
        vscode.window.showErrorMessage(`提交失败: ${stderr || err.message}`);
        return resolve(false);
      }

      // 提交成功
      Logger.info(`Git commit successful: ${message}`);
      vscode.window.showInformationMessage(`提交成功: ${message}`);
      repository.inputBox.value = "";
      repository.refresh();
      return resolve(true);
    });
  });
}
