import * as vscode from "vscode";
import * as path from "path";
import { getWorkspaceConfigPath } from "../utils/config";

describe("getWorkspaceConfigPath 函数测试", () => {
  // 保存原始的workspaceFolders
  const originalWorkspaceFolders = vscode.workspace.workspaceFolders;

  // 在所有测试后恢复原始值
  afterAll(() => {
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => originalWorkspaceFolders,
    });
  });

  test("有工作区时返回正确的配置文件路径", () => {
    // 模拟工作区
    const mockWorkspaceFolder = {
      uri: { fsPath: "/mock/workspace" },
      name: "mock",
      index: 0,
    };
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => [mockWorkspaceFolder],
    });

    // 调用getWorkspaceConfigPath函数
    const configPath = getWorkspaceConfigPath();

    // 验证结果
    const expectedPath = path.join("/mock/workspace", "commitail.config.json");
    expect(configPath).toBe(expectedPath);
  });

  test("没有工作区时返回null", () => {
    // 模拟没有工作区
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => undefined,
    });

    // 调用getWorkspaceConfigPath函数
    const configPath = getWorkspaceConfigPath();

    // 验证结果
    expect(configPath).toBeNull();
  });

  test("多个工作区时使用第一个工作区", () => {
    // 模拟多个工作区
    const mockWorkspaceFolders = [
      { uri: { fsPath: "/mock/workspace1" }, name: "mock1", index: 0 },
      { uri: { fsPath: "/mock/workspace2" }, name: "mock2", index: 1 },
    ];
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      get: () => mockWorkspaceFolders,
    });

    // 调用getWorkspaceConfigPath函数
    const configPath = getWorkspaceConfigPath();

    // 验证结果
    const expectedPath = path.join("/mock/workspace1", "commitail.config.json");
    expect(configPath).toBe(expectedPath);
  });
});
