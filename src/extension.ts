import * as vscode from "vscode";
import * as nls from "vscode-nls";
import { loadConfig, createDefaultConfig } from "./utils/config";
import { commitWithAppend } from "./commands/commitWithAppend";
import { Logger } from "./utils/logger";

const localize = nls.loadMessageBundle();

export function activate(context: vscode.ExtensionContext) {
  // 初始化日志系统
  Logger.initialize("CommiTail");

  // 在激活时检查配置文件
  const initialConfig = loadConfig();
  if (!initialConfig) {
    Logger.warn(
      "No valid configuration file found or configuration is invalid"
    );
    Logger.info(
      "Please ensure a valid commitail.config.json exists in the workspace root"
    );
    Logger.info("Configuration example:");
    Logger.info(
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
    Logger.info("Configuration file loaded successfully");
    Logger.info(`Loaded ${initialConfig.appendOptions.length} suffix options`);
  }

  // 注册创建配置文件命令
  const createConfigDisposable = vscode.commands.registerCommand(
    "commitail.createConfig",
    async () => {
      await createDefaultConfig();
    }
  );

  // 注册提交命令
  const commitWithAppendDisposable = vscode.commands.registerCommand(
    "commitail.commitWithAppend",
    commitWithAppend
  );

  // 将命令添加到订阅列表
  context.subscriptions.push(commitWithAppendDisposable);
  context.subscriptions.push(createConfigDisposable);

  Logger.info("CommiTail extension activated successfully");
}

export function deactivate() {
  Logger.info("CommiTail extension deactivated");
  Logger.dispose();
}
