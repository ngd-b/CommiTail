import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { execGitCommit } from '../extension';

// 模拟child_process模块
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// 模拟vscode.window
jest.spyOn(vscode.window, 'showErrorMessage');
jest.spyOn(vscode.window, 'showInformationMessage');

describe('execGitCommit 函数测试', () => {
  // 在每个测试前重置所有模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('成功执行Git提交', async () => {
    // 模拟成功执行命令
    (childProcess.exec as jest.Mock).mockImplementation((cmd, options, callback) => {
      callback(null, 'Commit successful', '');
      return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() } };
    });
    
    // 创建模拟的Git仓库对象
    const mockRepository = {
      state: {
        indexChanges: ['file1.txt'],
      },
      inputBox: {
        value: '',
      },
      refresh: jest.fn(),
      rootUri: {
        fsPath: '/mock/repo/path'
      }
    };
    
    // 调用execGitCommit函数
    const commitMessage = 'test: 测试提交';
    const result = await execGitCommit(mockRepository as any, commitMessage);
    
    // 验证结果
    expect(result).toBe(true);
    expect(childProcess.exec).toHaveBeenCalledWith(
      expect.stringContaining('git commit -m'),
      expect.objectContaining({ cwd: '/mock/repo/path' }),
      expect.any(Function)
    );
    expect(mockRepository.refresh).toHaveBeenCalled();
    expect(mockRepository.inputBox.value).toBe('');
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('提交成功')
    );
  });

  test('没有暂存的更改时应该显示错误消息', async () => {
    // 创建模拟的Git仓库对象，没有暂存的更改
    const mockRepository = {
      state: {
        indexChanges: [],
      },
      rootUri: {
        fsPath: '/mock/repo/path'
      }
    };
    
    // 调用execGitCommit函数
    const commitMessage = 'test: 测试提交';
    const result = await execGitCommit(mockRepository as any, commitMessage);
    
    // 验证结果
    expect(result).toBe(false);
    expect(childProcess.exec).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('没有暂存的更改')
    );
  });

  test('Git命令执行失败时应该显示错误消息', async () => {
    // 模拟命令执行失败
    const errorMessage = 'Command failed';
    (childProcess.exec as jest.Mock).mockImplementation((cmd, options, callback) => {
      callback(new Error(errorMessage), '', errorMessage);
      return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() } };
    });
    
    // 创建模拟的Git仓库对象
    const mockRepository = {
      state: {
        indexChanges: ['file1.txt'],
      },
      inputBox: {
        value: 'test: 测试提交',
      },
      refresh: jest.fn(),
      rootUri: {
        fsPath: '/mock/repo/path'
      }
    };
    
    // 调用execGitCommit函数
    const commitMessage = 'test: 测试提交';
    const result = await execGitCommit(mockRepository as any, commitMessage);
    
    // 验证结果
    expect(result).toBe(false);
    expect(childProcess.exec).toHaveBeenCalledWith(
      expect.stringContaining('git commit -m'),
      expect.objectContaining({ cwd: '/mock/repo/path' }),
      expect.any(Function)
    );
    expect(mockRepository.refresh).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('提交失败')
    );
  });
});