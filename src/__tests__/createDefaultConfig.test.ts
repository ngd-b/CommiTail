import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createDefaultConfig } from '../extension';

// 模拟fs模块
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// 模拟vscode.workspace
Object.defineProperty(vscode.workspace, 'workspaceFolders', {
  get: () => [
    { uri: { fsPath: '/mock/workspace' }, name: 'mock', index: 0 }
  ]
});

// 模拟vscode.window
jest.spyOn(vscode.window, 'showInformationMessage');
jest.spyOn(vscode.window, 'showErrorMessage');

describe('createDefaultConfig 函数测试', () => {
  // 在每个测试前重置所有模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('成功创建默认配置文件并写入 .gitignore', async () => {
    // 模拟文件不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    
    // 验证结果
    const expectedConfigPath = path.join('/mock/workspace', 'commitail.config.json');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedConfigPath);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedConfigPath,
      expect.stringContaining('"appendOptions"'),
      'utf-8'
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('配置文件已创建')
    );
  });

  test('.gitignore 已包含条目时不应重复写入', async () => {
    // 假设 gitignore 已包含条目
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p.endsWith('.gitignore')) return true;
      return false;
    });
    (fs.readFileSync as jest.Mock).mockReturnValue('commitail.config.json\n');

    await createDefaultConfig();

    // appendFileSync 不应被调用
    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });

  test('文件已存在时询问用户是否覆盖', async () => {
    // 模拟文件已存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟用户选择不覆盖
    (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
    
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    
    // 验证结果
    const expectedConfigPath = path.join('/mock/workspace', 'commitail.config.json');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedConfigPath);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('配置文件已存在'),
      '覆盖'
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('文件已存在且用户选择覆盖时应该覆盖文件', async () => {
    // 模拟文件已存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟用户选择覆盖
    (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('覆盖');
    
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    
    // 验证结果
    const expectedConfigPath = path.join('/mock/workspace', 'commitail.config.json');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedConfigPath);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('配置文件已存在'),
      '覆盖'
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedConfigPath,
      expect.stringContaining('"appendOptions"'),
      'utf-8'
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('配置文件已创建')
    );
  });

  test('写入文件时发生错误应该显示错误消息', async () => {
    // 模拟文件不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // 模拟写入文件时抛出错误
    const errorMessage = '写入文件失败';
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });
    
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    
    // 验证结果
    const expectedConfigPath = path.join('/mock/workspace', 'commitail.config.json');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedConfigPath);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedConfigPath,
      expect.stringContaining('"appendOptions"'),
      'utf-8'
    );
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('创建配置文件时发生错误')
    );
  });

  test('没有工作区时应该显示错误消息', async () => {
    // 模拟没有工作区
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => undefined,
      configurable: true
    });
    
    // 调用createDefaultConfig函数
    await createDefaultConfig();
    
    // 验证结果
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('没有打开的工作区')
    );
  });
});