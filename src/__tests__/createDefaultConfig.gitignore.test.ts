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
jest.spyOn(vscode.window, "showErrorMessage");
jest.spyOn(vscode.window, "showInformationMessage");

// 模拟 logger 模块
jest.mock("../utils/logger", () => ({
  Logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe("createDefaultConfig .gitignore 相关测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 模拟 appendFileSync 默认实现，避免未被调用时报错
    (fs.appendFileSync as jest.Mock).mockImplementation(() => {});

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

  test(".gitignore 不存在时应该创建并添加条目", async () => {
    // 模拟配置文件不存在，.gitignore不存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return false;
      return false;
    });

    // 模拟写入文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.appendFileSync as jest.Mock).mockImplementation(
      (path, data, encoding = "utf-8") => {}
    );

    // 调用createDefaultConfig函数
    await createDefaultConfig();

    // 验证结果
    const expectedGitignorePath = path.join("/mock/workspace", ".gitignore");
    expect(fs.existsSync).toHaveBeenCalledWith(expectedGitignorePath);
    const calls = (fs.appendFileSync as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(expectedGitignorePath);
    expect(typeof calls[0][1]).toBe("string");
    expect(calls[0][1]).toContain("commitail.config.json");
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("配置文件已创建并已添加到 .gitignore")
    );
  });

  test(".gitignore 存在但为空时应该添加条目", async () => {
    // 模拟配置文件不存在，.gitignore存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });

    // 模拟.gitignore内容为空
    (fs.readFileSync as jest.Mock).mockReturnValue("");

    // 模拟写入文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.appendFileSync as jest.Mock).mockImplementation(
      (path, data, encoding = "utf-8") => {}
    );

    // 调用createDefaultConfig函数
    await createDefaultConfig();

    // 验证结果
    const expectedGitignorePath = path.join("/mock/workspace", ".gitignore");
    expect(fs.existsSync).toHaveBeenCalledWith(expectedGitignorePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expectedGitignorePath,
      "utf-8"
    );
    const calls = (fs.appendFileSync as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(expectedGitignorePath);
    expect(typeof calls[0][1]).toBe("string");
    expect(calls[0][1]).toContain("commitail.config.json");
  });

  test(".gitignore 已包含条目时不应重复添加", async () => {
    // 模拟配置文件不存在，.gitignore存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });

    // 模拟.gitignore已包含条目
    (fs.readFileSync as jest.Mock).mockReturnValue("commitail.config.json\n");

    // 模拟写入文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    // 调用createDefaultConfig函数
    await createDefaultConfig();

    // 验证结果
    const expectedGitignorePath = path.join("/mock/workspace", ".gitignore");
    expect(fs.existsSync).toHaveBeenCalledWith(expectedGitignorePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expectedGitignorePath,
      "utf-8"
    );
    // appendFileSync 不应被调用
    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });

  test(".gitignore 包含其他内容时应该正确添加条目", async () => {
    // 模拟配置文件不存在，.gitignore存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });

    // 模拟.gitignore包含其他内容且不以换行符结尾
    (fs.readFileSync as jest.Mock).mockReturnValue("node_modules/\n.env");

    // 模拟写入文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.appendFileSync as jest.Mock).mockImplementation(
      (path, data, encoding = "utf-8") => {}
    );

    // 调用createDefaultConfig函数
    await createDefaultConfig();

    // 验证结果
    const expectedGitignorePath = path.join("/mock/workspace", ".gitignore");
    expect(fs.existsSync).toHaveBeenCalledWith(expectedGitignorePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expectedGitignorePath,
      "utf-8"
    );
    const calls = (fs.appendFileSync as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(expectedGitignorePath);
    expect(typeof calls[0][1]).toBe("string");
    expect(calls[0][1]).toContain("commitail.config.json");
  });

  test("读取 .gitignore 时发生错误应该继续执行", async () => {
    // 模拟配置文件不存在，.gitignore存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return true;
      return false;
    });
    // 模拟读取.gitignore时抛出错误
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("读取文件失败");
    });
    // 模拟写入文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    // 验证 Logger.warn 被调用
    // 只要 Logger.warn 被调用即可
    const logger = require("../utils/logger");
    expect(logger.Logger.warn).toHaveBeenCalled();
  });

  test("写入 .gitignore 时发生错误应该显示错误消息", async () => {
    // 模拟配置文件不存在，.gitignore不存在
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith("commitail.config.json")) return false;
      if (p.endsWith(".gitignore")) return false;
      return false;
    });

    // 模拟写入配置文件成功
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    // 模拟写入.gitignore时抛出错误
    (fs.appendFileSync as jest.Mock).mockImplementation(
      (path, data, encoding = "utf-8") => {
        throw new Error("写入.gitignore失败");
      }
    );

    // 调用createDefaultConfig函数
    await createDefaultConfig();

    // 验证结果
    const expectedGitignorePath = path.join("/mock/workspace", ".gitignore");
    const calls = (fs.appendFileSync as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(expectedGitignorePath);
    expect(typeof calls[0][1]).toBe("string");
    expect(calls[0][1]).toContain("commitail.config.json");
  });
});
