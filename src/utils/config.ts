import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as nls from "vscode-nls";
import { Config, ValidationResult } from "../types";
import { Logger } from "./logger";

const localize = nls.loadMessageBundle();

export function getWorkspaceConfigPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, "commitail.config.json");
}

export function loadConfig(configPath?: string): Config | null {
  const filePath = configPath || getWorkspaceConfigPath();
  if (!filePath) {
    Logger.warn("No workspace found, cannot load config");
    return null;
  }

  if (!fs.existsSync(filePath)) {
    Logger.info(`Config file not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const config = JSON.parse(content) as Config;
    const validationResult = validateConfig(config);

    if (!validationResult.isValid) {
      Logger.error(`Invalid config: ${validationResult.message}`);
      vscode.window.showErrorMessage(
        localize(
          "extension.invalidConfigError",
          "配置文件格式无效: {0}",
          validationResult.message
        )
      );
      return null;
    }

    Logger.info(`Config loaded successfully from: ${filePath}`);
    return config;
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    Logger.error(
      `Failed to load config from ${filePath}: ${errorMessage}`,
      error
    );
    vscode.window.showErrorMessage(
      localize(
        "extension.loadConfigError",
        "读取配置文件时发生错误: {0}",
        errorMessage
      )
    );
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
    return {
      isValid: false,
      message: localize("extension.emptyConfigError", "配置文件为空或格式无效"),
    };
  }

  // 验证appendOptions字段
  if (!config.appendOptions || !Array.isArray(config.appendOptions)) {
    return {
      isValid: false,
      message: localize(
        "extension.typeIsNotArrayError",
        "appendOptions 必须是一个数组"
      ),
    };
  }

  if (config.appendOptions.length === 0) {
    return {
      isValid: false,
      message: localize(
        "extension.emptyArrayError",
        "appendOptions 不能为空数组"
      ),
    };
  }

  // 验证每个选项是否为字符串或 [值, 描述] 数组
  for (let i = 0; i < config.appendOptions.length; i++) {
    const option = config.appendOptions[i];
    if (typeof option === "string") {
      continue;
    }
    if (
      !Array.isArray(option) ||
      option.length < 2 ||
      typeof option[0] !== "string" ||
      typeof option[1] !== "string"
    ) {
      return {
        isValid: false,
        message: localize(
          "extension.appendOptionTypeError",
          "appendOptions 中的元素必须是字符串或长度为2的字符串数组"
        ),
      };
    }
  }

  // 验证manual字段
  if (config.manual !== undefined && typeof config.manual !== "boolean") {
    return {
      isValid: false,
      message: localize("extension.manualTypeError", "manual 必须是一个布尔值"),
    };
  }

  // 验证defaultIndex字段
  if (config.defaultIndex !== undefined) {
    if (
      typeof config.defaultIndex !== "number" ||
      !Number.isInteger(config.defaultIndex)
    ) {
      return {
        isValid: false,
        message: localize(
          "extension.defaultIndexTypeError",
          "defaultIndex 必须是一个数字"
        ),
      };
    }

    // 验证defaultIndex范围
    if (
      config.defaultIndex < 0 ||
      config.defaultIndex >= config.appendOptions.length
    ) {
      return {
        isValid: false,
        message: localize(
          "extension.defaultIndexRangeError",
          "defaultIndex 超出范围，必须在0到{0}之间",
          config.appendOptions.length - 1
        ),
      };
    }
  }

  // 所有验证通过
  return { isValid: true, message: "", config: config as Config };
}

/**
 * 创建默认配置文件
 * @returns 是否成功创建配置文件
 */
export async function createDefaultConfig(): Promise<boolean> {
  const configPath = getWorkspaceConfigPath();
  if (!configPath) {
    Logger.error("No workspace found, cannot create config file");
    vscode.window.showErrorMessage(
      localize("extension.noWorkspace", "没有打开的工作区，无法创建配置文件")
    );
    return false;
  }

  // 检查文件是否已存在
  if (fs.existsSync(configPath)) {
    const overwriteOption = localize("extension.overwrite", "覆盖");
    const overwrite = await vscode.window.showInformationMessage(
      localize("extension.configFileExists", "配置文件已存在，是否覆盖？"),
      overwriteOption
    );
    if (overwrite !== overwriteOption) {
      Logger.info("User cancelled config file creation");
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

    // 将配置文件加入 .gitignore
    try {
      const workspaceRoot = path.dirname(configPath);
      const gitignorePath = path.join(workspaceRoot, ".gitignore");
      let gitignoreContent = "";
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
      }
      const ignoreEntry = "commitail.config.json";
      const hasEntry = gitignoreContent
        .split(/\r?\n/)
        .some(
          (line) =>
            line.trim() === ignoreEntry || line.trim() === `/${ignoreEntry}`
        );
      if (!hasEntry) {
        const prefixNewline =
          gitignoreContent === "" || gitignoreContent.endsWith("\n")
            ? ""
            : "\n";
        fs.appendFileSync(gitignorePath, `${prefixNewline}${ignoreEntry}\n`);
        Logger.info("Added config file to .gitignore");
      }
    } catch (e) {
      Logger.warn(`Failed to update .gitignore: ${e}`);
    }

    Logger.info(`Config file created successfully: ${configPath}`);
    vscode.window.showInformationMessage(
      localize(
        "extension.configCreated",
        "配置文件已创建并已添加到 .gitignore: {0}",
        configPath
      )
    );
    return true;
  } catch (error: any) {
    Logger.error(`Failed to create config file: ${error.message}`, error);
    vscode.window.showErrorMessage(
      localize(
        "extension.configCreationError",
        "创建配置文件时发生错误: {0}",
        error.message
      )
    );
    return false;
  }
}
