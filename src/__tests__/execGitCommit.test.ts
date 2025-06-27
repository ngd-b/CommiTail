import * as vscode from "vscode";
import { execGitCommit } from "../utils/git";
import { GitRepository } from "../types";

// 模拟child_process.exec
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

// 模拟vscode.window
jest.spyOn(vscode.window, "showErrorMessage");
jest.spyOn(vscode.window, "showInformationMessage");

describe("execGitCommit 函数测试", () => {
  let mockRepository: GitRepository;
  let mockExec: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 获取mock的exec函数
    const { exec } = require("child_process");
    mockExec = exec as jest.Mock;

    // 创建模拟的Git仓库对象
    mockRepository = {
      state: {
        indexChanges: ["file1.txt"],
        workingTreeChanges: [],
      },
      inputBox: {
        value: "test: 测试提交",
      },
      refresh: jest.fn(),
      rootUri: {
        fsPath: "/mock/repo/path",
      },
    } as GitRepository;
  });

  test("成功执行git commit命令", async () => {
    const commitMessage = "feat: 添加新功能";

    // 模拟exec成功
    mockExec.mockImplementation((command, options, callback) => {
      expect(command).toContain("git commit");
      expect(command).toContain(commitMessage);
      expect(options.cwd).toBe("/mock/repo/path");
      callback(null, "commit success", "");
    });

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepository, commitMessage);

    // 验证结果
    expect(result).toBe(true);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("git commit"),
      expect.objectContaining({ cwd: "/mock/repo/path" }),
      expect.any(Function)
    );
    expect(mockRepository.refresh).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("提交成功")
    );
  });

  test("git commit执行失败时显示错误消息", async () => {
    const commitMessage = "feat: 添加新功能";
    const errorMessage = "commit failed";

    // 模拟exec失败
    mockExec.mockImplementation((command, options, callback) => {
      callback(new Error(errorMessage), "", errorMessage);
    });

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepository, commitMessage);

    // 验证结果
    expect(result).toBe(false);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("git commit"),
      expect.objectContaining({ cwd: "/mock/repo/path" }),
      expect.any(Function)
    );
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("提交失败")
    );
  });

  test("没有暂存的更改时显示错误消息", async () => {
    // 创建没有暂存更改的模拟仓库
    const mockRepoNoChanges = {
      ...mockRepository,
      state: {
        indexChanges: [],
        workingTreeChanges: [],
      },
    } as GitRepository;

    const commitMessage = "feat: 添加新功能";

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepoNoChanges, commitMessage);

    // 验证结果
    expect(result).toBe(false);
    expect(mockExec).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("没有暂存的更改")
    );
  });

  test("空提交消息时正常执行", async () => {
    const commitMessage = "";

    // 模拟exec成功
    mockExec.mockImplementation((command, options, callback) => {
      expect(command).toContain("git commit");
      expect(command).toContain('""');
      callback(null, "commit success", "");
    });

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepository, commitMessage);

    // 验证结果
    expect(result).toBe(true);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("git commit"),
      expect.objectContaining({ cwd: "/mock/repo/path" }),
      expect.any(Function)
    );
  });

  test("特殊字符在提交消息中正确转义", async () => {
    const commitMessage = 'feat: 添加"特殊"字符';

    // 模拟exec成功
    mockExec.mockImplementation((command, options, callback) => {
      expect(command).toContain("git commit");
      expect(command).toContain('feat: 添加"特殊"字符');
      callback(null, "commit success", "");
    });

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepository, commitMessage);

    // 验证结果
    expect(result).toBe(true);
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("git commit"),
      expect.objectContaining({ cwd: "/mock/repo/path" }),
      expect.any(Function)
    );
  });

  test("提交成功后清空输入框", async () => {
    const commitMessage = "feat: 添加新功能";

    // 模拟exec成功
    mockExec.mockImplementation((command, options, callback) => {
      callback(null, "commit success", "");
    });

    // 调用execGitCommit函数
    const result = await execGitCommit(mockRepository, commitMessage);

    // 验证结果
    expect(result).toBe(true);
    expect(mockRepository.inputBox.value).toBe("");
  });
});
