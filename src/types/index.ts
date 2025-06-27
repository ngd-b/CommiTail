// 配置相关类型
export interface Config {
  // appendOptions 可以是字符串数组或形如 [值, 描述] 的二维数组
  appendOptions: Array<string | [string, string]>;
  defaultIndex?: number;
  manual?: boolean;
}

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  message: string;
  config?: Config;
}

// Git仓库类型
export interface GitRepository {
  state: {
    indexChanges: any[];
    workingTreeChanges: any[];
  };
  inputBox: {
    value: string;
  };
  refresh: () => void;
  rootUri: {
    fsPath: string;
  };
}

// 命令执行结果类型
export interface CommandResult {
  success: boolean;
  message?: string;
  error?: Error;
}
