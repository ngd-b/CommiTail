/**
 * 模拟extension.ts文件
 */

// 导出接口以便测试文件使用
export interface Config {
  appendOptions: string[];
  defaultIndex?: number;
  manual?: boolean;
}

// 导出验证结果接口
export interface ValidationResult {
  isValid: boolean;
  message: string;
  config?: Config;
}

// 模拟getGitExtension函数
export const getGitExtension = jest.fn();

// 模拟getWorkspaceConfigPath函数
export const getWorkspaceConfigPath = jest.fn();

// 模拟loadConfig函数
export const loadConfig = jest.fn();

// 模拟validateConfig函数
export const validateConfig = jest.fn();

// 模拟execGitCommit函数
export const execGitCommit = jest.fn();

// 模拟createDefaultConfig函数
export const createDefaultConfig = jest.fn();

// 导出原始模块中的其他函数和变量
const originalModule = jest.requireActual('../extension');

// 导出所有未明确模拟的函数和变量
Object.keys(originalModule).forEach(key => {
  if (!exports[key]) {
    exports[key] = originalModule[key];
  }
});