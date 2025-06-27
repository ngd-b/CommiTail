import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { createDefaultConfig } from "../utils/config";

// 模拟fs模块
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// 模拟vscode.window
jest.spyOn(vscode.window, "showInformationMessage");

describe("createDefaultConfig .gitignore 逻辑", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 模拟工作区
    const mockWorkspaceFolder = {
      uri: { fsPath: "/mock/workspace" },
      name: "mock",
      index: 0,
    };
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => [mockWorkspaceFolder],
      configurable: true,
    });
  });

  test("首次创建时应向 .gitignore 追加条目", async () => {
    // 模拟配置文件不存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });

    // 模拟.gitignore内容为空
    (fs.readFileSync as jest.Mock).mockReturnValue("");

    // 模拟写入操作成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.appendFileSync as jest.Mock).mockImplementation(() => {});

    await createDefaultConfig();

    const gitignorePath = path.join("/mock/workspace", ".gitignore");
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      gitignorePath,
      "\ncommitail.config.json\n"
    );
  });

  test("已包含条目时不应重复写入", async () => {
    // 模拟配置文件不存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });

    // 模拟.gitignore已包含条目
    (fs.readFileSync as jest.Mock).mockReturnValue("commitail.config.json\n");

    await createDefaultConfig();

    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });
});
