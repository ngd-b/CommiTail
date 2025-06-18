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
    const config = JSON.parse(content) as Config;
    return validateConfig(config);
  } catch (error: any) {
    // 记录配置加载错误
    const errorMessage = error.message || "Unknown error";
    console.error(`Failed to load config: ${errorMessage}`);
    return null;
  }
}

/**
 * 验证配置文件的有效性
 * @param config 待验证的配置对象
 * @returns 验证后的配置对象，如果无效则返回null
 */
function validateConfig(config: any): Config | null {
  // 验证基本结构
  if (!config) {
    vscode.window.showErrorMessage("配置文件为空或格式无效");
    return null;
  }

  // 验证appendOptions字段
  if (!config.appendOptions || !Array.isArray(config.appendOptions)) {
    vscode.window.showErrorMessage("配置文件缺少有效的appendOptions数组");
    return null;
  }

  if (config.appendOptions.length === 0) {
    vscode.window.showErrorMessage("appendOptions数组不能为空");
    return null;
  }

  // 验证每个选项是否为字符串
  for (let i = 0; i < config.appendOptions.length; i++) {
    if (typeof config.appendOptions[i] !== "string") {
      vscode.window.showErrorMessage(`appendOptions[${i}]必须是字符串`);
      return null;
    }
  }

  // 验证manual字段
  if (config.manual !== undefined && typeof config.manual !== "boolean") {
    vscode.window.showErrorMessage("manual字段必须是布尔值");
    return null;
  }

  // 验证defaultIndex字段
  if (config.defaultIndex !== undefined) {
    if (
      typeof config.defaultIndex !== "number" ||
      !Number.isInteger(config.defaultIndex)
    ) {
      vscode.window.showErrorMessage("defaultIndex必须是整数");
      return null;
    }

    // 验证defaultIndex范围
    if (
      config.defaultIndex < 0 ||
      config.defaultIndex >= config.appendOptions.length
    ) {
      vscode.window.showErrorMessage(
        `defaultIndex值(${config.defaultIndex})超出范围，必须在0到${
          config.appendOptions.length - 1
        }之间`
      );
      return null;
    }
  }

  // 所有验证通过
  return config as Config;
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
              // 提供更详细的错误信息
              const errorMessage = stderr || err2.message;
              const detailedError = `Git commit failed: ${errorMessage}`;
              vscode.window
                .showErrorMessage(
                  detailedError,
                  { modal: true },
                  { title: "Show Details" }
                )
                .then((selection) => {
                  if (selection && selection.title === "Show Details") {
                    // 显示详细错误信息
                    const detailsChannel = vscode.window.createOutputChannel(
                      "CommiTail Error Details"
                    );
                    detailsChannel.appendLine(
                      "=== Git Commit Error Details ==="
                    );
                    detailsChannel.appendLine(
                      `Time: ${new Date().toLocaleString()}`
                    );
                    detailsChannel.appendLine(
                      `Command: git commit -m "${message}"`
                    );
                    detailsChannel.appendLine(`Working Directory: ${cwd}`);
                    detailsChannel.appendLine(`Error: ${errorMessage}`);
                    if (stdout) {
                      detailsChannel.appendLine(`\nOutput:\n${stdout}`);
                    }
                    detailsChannel.show();
                  }
                });
              reject(new Error(detailedError));
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
        const noChangesError =
          "No staged changes to commit. Please stage your changes first.";
        vscode.window
          .showWarningMessage(
            noChangesError,
            { modal: false },
            { title: "How to Stage Changes" }
          )
          .then((selection) => {
            if (selection && selection.title === "How to Stage Changes") {
              // 显示如何暂存更改的帮助信息
              vscode.env.openExternal(
                vscode.Uri.parse(
                  "https://code.visualstudio.com/docs/editor/versioncontrol#_git-support"
                )
              );
            }
          });
        reject(new Error(noChangesError));
      }
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  // 创建输出通道，用于记录扩展日志
  const outputChannel = vscode.window.createOutputChannel("CommiTail");

  // 在激活时检查配置文件
  const initialConfig = loadConfig();
  if (!initialConfig) {
    outputChannel.appendLine(
      `[${new Date().toLocaleString()}] 警告: 未找到有效的配置文件或配置无效`
    );
    outputChannel.appendLine(
      "请确保在工作区根目录创建有效的commitail.config.json文件"
    );
    outputChannel.appendLine("配置文件示例:");
    outputChannel.appendLine(
      JSON.stringify(
        {
          appendOptions: ["[skip ci]", "🔧 chore", "🧪 test", "🚀 deploy"],
          manual: true,
          defaultIndex: 0,
        },
        null,
        2
      )
    );
  } else {
    outputChannel.appendLine(
      `[${new Date().toLocaleString()}] 成功加载配置文件`
    );
    outputChannel.appendLine(
      `已加载 ${initialConfig.appendOptions.length} 个后缀选项`
    );
  }

  // 注册创建配置文件命令
  const createConfigDisposable = vscode.commands.registerCommand(
    "commitail.createConfig",
    async () => {
      await createDefaultConfig();
    }
  );

  const commitWithAppendDisposable = vscode.commands.registerCommand(
    "commitail.commitWithAppend",
    async () => {
      const git = getGitExtension();
      if (!git) {
        vscode.window.showErrorMessage("Git扩展未找到，请确保已安装Git扩展");
        return;
      }
      const repo = git.repositories[0];
      if (!repo) {
        vscode.window.showErrorMessage(
          "未找到Git仓库，请确保当前工作区是Git仓库"
        );
        return;
      }

      const inputBox = repo.inputBox;
      const originalMessage = inputBox.value.trim();

      if (!originalMessage) {
        vscode.window.showWarningMessage("请先输入提交信息");
        return;
      }

      // 每次命令执行时重新加载配置，以便获取最新配置
      const config = loadConfig();
      if (!config) {
        const configPath = getWorkspaceConfigPath() || "commitail.config.json";
        vscode.window
          .showErrorMessage(
            `未找到有效的配置文件: ${configPath}`,
            "创建示例配置",
            "查看文档"
          )
          .then(async (selection) => {
            if (selection === "创建示例配置") {
              // 使用createDefaultConfig函数创建配置文件
              await createDefaultConfig();
            } else if (selection === "查看文档") {
              vscode.env.openExternal(
                vscode.Uri.parse(
                  "https://github.com/ngd-b/CommiTail/blob/main/README.md"
                )
              );
            }
          });
        return;
      }
      if (!config.appendOptions || config.appendOptions.length === 0) {
        vscode.window.showWarningMessage(
          "配置文件中未找到有效的appendOptions选项"
        );
        return;
      }

      let selectedSuffix: string | undefined;

      // manual=false 表示不弹选择框，使用 defaultIndex
      if (config.manual === false) {
        // 默认索引为 0，如果未设置
        const index =
          typeof config.defaultIndex === "number" ? config.defaultIndex : 0;

        // 这里不需要再次检查范围，因为validateConfig已经验证过
        selectedSuffix = config.appendOptions[index];
      } else {
        selectedSuffix = await vscode.window.showQuickPick(
          config.appendOptions,
          {
            placeHolder: "选择要追加的提交信息后缀",
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
      } catch (error: any) {
        // 失败时不清空输入框，并显示详细错误
        console.error("CommiTail commit error:", error);

        // 根据错误类型提供不同的用户提示
        if (error.message.includes("No staged changes")) {
          // 已经在execGitCommit中处理了这个错误
        } else if (error.message.includes("not a git repository")) {
          vscode.window.showErrorMessage(
            "当前目录不是Git仓库，请确认您在正确的项目中。"
          );
        } else if (error.message.includes("Permission denied")) {
          vscode.window.showErrorMessage(
            "Git操作权限被拒绝，请检查您的权限设置。"
          );
        } else {
          // 通用错误处理
          vscode.window
            .showErrorMessage(`提交失败: ${error.message}`, "查看日志")
            .then((selection) => {
              if (selection === "查看日志") {
                const outputChannel =
                  vscode.window.createOutputChannel("CommiTail");
                outputChannel.appendLine(`=== 提交失败 ===`);
                outputChannel.appendLine(
                  `时间: ${new Date().toLocaleString()}`
                );
                outputChannel.appendLine(`消息: ${finalMessage}`);
                outputChannel.appendLine(`错误: ${error.message}`);
                outputChannel.appendLine(
                  `堆栈: ${error.stack || "无堆栈信息"}`
                );
                outputChannel.show();
              }
            });
        }
      }
    }
  );

  // 将命令添加到订阅列表
  context.subscriptions.push(commitWithAppendDisposable);
  context.subscriptions.push(createConfigDisposable);
  context.subscriptions.push(outputChannel);
}

export function deactivate() {}

/**
 * 创建默认配置文件
 * @returns 是否成功创建配置文件
 */
async function createDefaultConfig(): Promise<boolean> {
  const configPath = getWorkspaceConfigPath();
  if (!configPath) {
    vscode.window.showErrorMessage("未找到有效的工作区，无法创建配置文件");
    return false;
  }

  // 检查文件是否已存在
  if (fs.existsSync(configPath)) {
    const overwrite = await vscode.window.showWarningMessage(
      "配置文件已存在，是否覆盖？",
      { modal: true },
      "是",
      "否"
    );
    if (overwrite !== "是") {
      return false;
    }
  }

  // 默认配置
  const defaultConfig: Config = {
    appendOptions: ["[skip ci]", "🔧 chore", "🧪 test", "🚀 deploy"],
    manual: true,
    defaultIndex: 0,
  };

  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8"
    );
    vscode.window.showInformationMessage(`已创建配置文件: ${configPath}`);
    return true;
  } catch (error: any) {
    vscode.window.showErrorMessage(`创建配置文件失败: ${error.message}`);
    return false;
  }
}
