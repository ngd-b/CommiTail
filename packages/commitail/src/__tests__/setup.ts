/**
 * 测试设置文件
 * 在所有测试运行前执行
 */

// 重置所有模拟
beforeEach(() => {
  jest.resetAllMocks();
  
  // 重置vscode模拟状态
  const vscode = require('vscode');
  if (vscode._reset) {
    vscode._reset();
  }
});

// 清理测试环境
afterEach(() => {
  jest.clearAllMocks();
});

// 模拟文件系统
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// 模拟child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// 全局超时设置
jest.setTimeout(10000);