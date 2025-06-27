import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "../utils/config";

// 模拟fs模块
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// 模拟vscode.window
jest.spyOn(vscode.window, "showErrorMessage");

describe("loadConfig 函数测试", () => {
  // 在每个测试前重置所有模拟
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

  test("配置文件存在且格式正确时成功加载", () => {
    const mockConfig = {
      appendOptions: ["[skip ci]", "[wip]"],
      defaultIndex: 0,
      manual: false,
    };

    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // 模拟读取文件内容
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(result).toEqual(mockConfig);
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json")
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json"),
      "utf-8"
    );
  });

  test("配置文件不存在时返回null", () => {
    // 模拟文件不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = loadConfig();

    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json")
    );
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test("配置文件格式错误时返回null", () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // 模拟读取到无效的JSON
    (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

    const result = loadConfig();

    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json")
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json"),
      "utf-8"
    );
  });

  test("读取文件时发生错误时返回null", () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // 模拟读取文件时抛出错误
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("读取文件失败");
    });

    const result = loadConfig();

    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json")
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join("/mock/workspace", "commitail.config.json"),
      "utf-8"
    );
  });

  test("没有工作区时返回null", () => {
    // 模拟没有工作区
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => undefined,
      configurable: true,
    });

    const result = loadConfig();

    expect(result).toBeNull();
    expect(fs.existsSync).not.toHaveBeenCalled();
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test("配置文件包含二维数组格式的appendOptions时正确解析", () => {
    const mockConfig = {
      appendOptions: [
        ["[skip ci]", "跳过CI"],
        ["[wip]", "工作进行中"],
      ],
      defaultIndex: 1,
      manual: true,
    };

    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // 模拟读取文件内容
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const result = loadConfig();

    expect(result).toEqual(mockConfig);
    expect(result?.appendOptions).toEqual([
      ["[skip ci]", "跳过CI"],
      ["[wip]", "工作进行中"],
    ]);
  });
});
