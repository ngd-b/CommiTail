import * as vscode from "vscode";
import * as nls from "vscode-nls";
import * as path from "path";
import { getGitExtension } from "../utils/git";
import {
  loadConfig,
  createDefaultConfig,
  getWorkspaceConfigPath,
} from "../utils/config";

const localize = nls.loadMessageBundle();

export async function commitWithAppend(): Promise<void> {
  const git = getGitExtension();
  if (!git) {
    vscode.window.showErrorMessage(
      localize(
        "extension.gitExtensionNotFound",
        "Git扩展未找到，请确保已安装Git扩展"
      )
    );
    return;
  }

  const repo = git.repositories[0];
  if (!repo) {
    vscode.window.showErrorMessage(
      localize(
        "extension.gitRepoNotFound",
        "未找到Git仓库，请确保当前工作区是Git仓库"
      )
    );
    return;
  }

  // 检查当前仓库是否有变更（包含已暂存和未暂存）
  if (
    repo.state.indexChanges.length === 0 &&
    repo.state.workingTreeChanges.length === 0
  ) {
    vscode.window.showWarningMessage(
      localize("extension.noChanges", "当前没有任何文件变更，无法追加提交信息")
    );
    return;
  }

  const inputBox = repo.inputBox;
  const originalMessage = inputBox.value.trim();

  // 每次命令执行时重新加载配置，以便获取最新配置
  const config = loadConfig();
  if (!config) {
    const configPath = getWorkspaceConfigPath() || "commitail.config.json";
    const createSampleOption = localize(
      "extension.createSampleConfig",
      "创建示例配置"
    );
    const viewDocsOption = localize("extension.viewDocs", "查看文档");
    vscode.window
      .showErrorMessage(
        localize(
          "extension.configFileNotFound",
          "未找到有效的配置文件: {0}",
          configPath
        ),
        createSampleOption,
        viewDocsOption
      )
      .then(async (selection) => {
        if (selection === createSampleOption) {
          // 使用createDefaultConfig函数创建配置文件
          await createDefaultConfig();
        } else if (selection === viewDocsOption) {
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
      localize(
        "extension.appendOptionsNotFound",
        "配置文件中未找到有效的appendOptions选项"
      )
    );
    return;
  }

  let selectedSuffix: string | undefined;

  if (config.manual === false) {
    // 默认索引为 0，如果未设置
    const index =
      typeof config.defaultIndex === "number" ? config.defaultIndex : 0;

    // 这里不需要再次检查范围，因为 validateConfig 已经验证过
    const option = config.appendOptions[index];
    selectedSuffix = Array.isArray(option) ? option[0] : option;
  } else {
    // 构造 QuickPickItem 列表，支持描述信息
    const quickPickItems: vscode.QuickPickItem[] = config.appendOptions.map(
      (opt) => {
        if (Array.isArray(opt)) {
          return { label: opt[0], description: opt[1] };
        }
        return { label: opt };
      }
    );

    const picked = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: localize(
        "extension.selectSuffixPlaceholder",
        "选择要追加的提交信息后缀"
      ),
      canPickMany: false,
    });

    if (!picked) {
      return; // 用户取消选择
    }

    selectedSuffix = picked.label || picked.description;
  }

  const finalMessage =
    originalMessage === ""
      ? `${selectedSuffix}`
      : `${originalMessage} ${selectedSuffix}`;

  // 若已包含同样后缀则不重复添加
  if (originalMessage.endsWith(selectedSuffix)) {
    vscode.window.showInformationMessage(
      localize(
        "extension.commitMessageContainsSuffix",
        "提交信息已包含所选后缀，无需重复添加"
      )
    );
    return;
  }

  // 仅修改输入框内容，不进行 git commit
  inputBox.value = finalMessage;
  vscode.window.showInformationMessage(
    localize("extension.suffixAppended", "已在提交信息尾部追加后缀")
  );
}
