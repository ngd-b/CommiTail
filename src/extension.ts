import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// 导出接口以便测试文件使用
export interface Config {
  appendOptions: string[];
  defaultIndex?: number;
  manual?: boolean;
}

// 导出验证结果接口
export interface ValidationResult {
  isValid: boolean;
  message: string;
  config?: Config;
}

export function getGitExtension() {
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (!gitExtension) return null;
  return gitExtension.exports.getAPI(1);
}

export function getWorkspaceConfigPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, "commitail.config.json");
}

export function loadConfig(configPath?: string): Config | null {
  const filePath = configPath || getWorkspaceConfigPath();
  if (!filePath) return null;
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const config = JSON.parse(content) as Config;
    const validationResult = exports.validateConfig(config);
    if (!validationResult.isValid) {
      vscode.window.showErrorMessage(`配置文件格式无效: ${validationResult.message}`);
      return null;
    }
    return config;
  } catch (error: any) {
    // 记录配置加载错误
    const errorMessage = error.message || "Unknown error";
    vscode.window.showErrorMessage(`读取配置文件时发生错误: ${errorMessage}`);
    console.error(`Failed to load config: ${errorMessage}`);
    return null;
  }
}

/**
 * 验证配置文件的有效性
 * @param config 待验证的配置对象
 * @returns 验证结果对象
 */
export function validateConfig(config: any): ValidationResult {
  // 验证基本结构
  if (!config) {
    return { isValid: false, message: "配置文件为空或格式无效" };
  }

  // 验证appendOptions字段
  if (!config.appendOptions || !Array.isArray(config.appendOptions)) {
    return { isValid: false, message: "appendOptions 必须是一个数组" };
  }

  if (config.appendOptions.length === 0) {
    return { isValid: false, message: "appendOptions 不能为空数组" };
  }

  // 验证每个选项是否为字符串
  for (let i = 0; i < config.appendOptions.length; i++) {
    if (typeof config.appendOptions[i] !== "string") {
      return { isValid: false, message: "appendOptions 中的所有元素必须是字符串" };
    }
  }

  // 验证manual字段
  if (config.manual !== undefined && typeof config.manual !== "boolean") {
    return { isValid: false, message: "manual 必须是一个布尔值" };
  }

  // 验证defaultIndex字段
  if (config.defaultIndex !== undefined) {
    if (
      typeof config.defaultIndex !== "number" ||
      !Number.isInteger(config.defaultIndex)
    ) {
      return { isValid: false, message: "defaultIndex 必须是一个数字" };
    }

    // 验证defaultIndex范围
    if (
      config.defaultIndex < 0 ||
      config.defaultIndex >= config.appendOptions.length
    ) {
      return { 
        isValid: false, 
        message: `defaultIndex 超出范围，必须在0到${config.appendOptions.length - 1}之间` 
      };
    }
  }

  // 所有验证通过
  return { isValid: true, message: "", config: config as Config };
}

export function execGitCommit(repository: any, message: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    // 检查是否有暂存变更
    if (!repository.state.indexChanges.length) {
      vscode.window.showErrorMessage('没有暂存的更改，请先暂存您的更改');
      return resolve(false);
    }

    // 执行提交
    exec(
      `git commit -m "${message.replace(/"/g, '\"')}"`,
      { cwd: repository.rootUri.fsPath },
      (err, stdout, stderr) => {
        if (err) {
          // 提交失败
          vscode.window.showErrorMessage(`提交失败: ${stderr || err.message}`);
          console.error('Git commit error:', err);
          return resolve(false);
        }
        
        // 提交成功
        vscode.window.showInformationMessage(`提交成功: ${message}`);
        repository.inputBox.value = '';
        repository.refresh();
        return resolve(true);
      }
    );
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
        const success = await execGitCommit(repo, finalMessage);
        if (success) {
          // 成功时已经在execGitCommit中处理了清空输入框和刷新仓库
        }
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
export async function createDefaultConfig(): Promise<boolean> {
  const configPath = getWorkspaceConfigPath();
  if (!configPath) {
    vscode.window.showErrorMessage('没有打开的工作区，无法创建配置文件');
    return false;
  }

  // 检查文件是否已存在
  if (fs.existsSync(configPath)) {
    const overwrite = await vscode.window.showInformationMessage(
      '配置文件已存在，是否覆盖？',
      '覆盖'
    );
    if (overwrite !== '覆盖') {
      return false;
    }
  }

  // 默认配置
  const defaultConfig: Config = {
    appendOptions: ['[skip ci]', '🔧 chore', '🧪 test', '🚀 deploy'],
    manual: true,
    defaultIndex: 0,
  };

  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );
    vscode.window.showInformationMessage(`配置文件已创建: ${configPath}`);
    return true;
  } catch (error: any) {
    vscode.window.showErrorMessage(`创建配置文件时发生错误: ${error.message}`);
    return false;
  }
}
