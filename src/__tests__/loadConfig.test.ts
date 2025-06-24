import * as vscode from 'vscode';
import * as fs from 'fs';
import * as extension from '../extension';

// 模拟vscode.window
jest.spyOn(vscode.window, 'showErrorMessage');

describe('loadConfig 函数测试', () => {
  // 在每个测试前重置所有模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('成功加载有效配置文件', () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟有效的配置文件内容
    const validConfig = {
      appendOptions: ['feat', 'fix', 'docs'],
      manual: false,
      defaultIndex: 0
    };
    const validConfigStr = JSON.stringify(validConfig);
    (fs.readFileSync as jest.Mock).mockReturnValue(validConfigStr);
    
    // 模拟validateConfig返回有效结果
    const validateConfigSpy = jest.spyOn(extension, 'validateConfig').mockReturnValueOnce({
      isValid: true,
      message: '',
      config: validConfig
    });
    
    // 调用loadConfig函数
    const configPath = '/path/to/config.json';
    const result = extension.loadConfig(configPath);
    
    // 验证结果
    expect(result).toEqual(validConfig);
    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8');
    expect(validateConfigSpy).toHaveBeenCalledWith(expect.objectContaining({
      appendOptions: ['feat', 'fix', 'docs'],
      manual: false,
      defaultIndex: 0
    }));
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  test('配置文件不存在时返回null', () => {
    // 模拟文件不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // 调用loadConfig函数
    const configPath = '/path/to/config.json';
    const result = extension.loadConfig(configPath);
    
    // 验证结果
    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(extension.validateConfig).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  test('配置文件格式无效时显示错误消息', () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟无效的JSON格式
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');
    
    // 调用loadConfig函数
    const configPath = '/path/to/config.json';
    const result = extension.loadConfig(configPath);
    
    // 验证结果
    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8');
    expect(extension.validateConfig).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('读取配置文件时发生错误')
    );
  });

  test('配置验证失败时显示错误消息', () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟有效的JSON格式但配置无效
    const invalidConfig = {
      appendOptions: [],
      manual: false,
      defaultIndex: 0
    };
    const invalidConfigStr = JSON.stringify(invalidConfig);
    (fs.readFileSync as jest.Mock).mockReturnValue(invalidConfigStr);
    
    // 模拟validateConfig返回无效结果
    const validateConfigSpy = jest.spyOn(extension, 'validateConfig').mockReturnValueOnce({
      isValid: false,
      message: 'appendOptions 不能为空数组'
    });
    
    // 调用loadConfig函数
    const configPath = '/path/to/config.json';
    const result = extension.loadConfig(configPath);
    
    // 验证结果
    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8');
    expect(validateConfigSpy).toHaveBeenCalledWith(expect.objectContaining({
      appendOptions: [],
      manual: false,
      defaultIndex: 0
    }));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('配置文件格式无效')
    );
  });

  test('读取文件时发生错误显示错误消息', () => {
    // 模拟文件存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟读取文件时抛出错误
    const errorMessage = '读取文件失败';
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });
    
    // 调用loadConfig函数
    const configPath = '/path/to/config.json';
    const result = extension.loadConfig(configPath);
    
    // 验证结果
    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(configPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8');
    expect(extension.validateConfig).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('读取配置文件时发生错误')
    );
  });
});