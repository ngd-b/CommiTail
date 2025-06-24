/**
 * VS Code API 模拟
 */

// 存储内部状态
const _state: Record<string, any> = {
  // 模拟窗口状态
  window: {
    showInformationMessage: jest.fn().mockResolvedValue(undefined),
    showWarningMessage: jest.fn().mockResolvedValue(undefined),
    showErrorMessage: jest.fn().mockResolvedValue(undefined),
    createOutputChannel: jest.fn().mockReturnValue({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    }),
    showQuickPick: jest.fn().mockResolvedValue(undefined),
    createWebviewPanel: jest.fn().mockReturnValue({
      webview: {
        html: '',
        onDidReceiveMessage: jest.fn(),
        postMessage: jest.fn(),
      },
      onDidDispose: jest.fn(),
      reveal: jest.fn(),
      dispose: jest.fn(),
    }),
  },
  
  // 模拟工作区状态
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn(),
      update: jest.fn(),
    }),
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    openTextDocument: jest.fn().mockResolvedValue({
      getText: jest.fn().mockReturnValue(''),
      save: jest.fn().mockResolvedValue(true),
    }),
  },
  
  // 模拟命令状态
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn().mockResolvedValue(undefined),
  },
  
  // 模拟扩展状态
  extensions: {
    getExtension: jest.fn().mockReturnValue({
      activate: jest.fn().mockResolvedValue({}),
      exports: {},
    }),
  },
};

// 重置所有模拟状态
const _reset = () => {
  Object.keys(_state).forEach(key => {
    const stateObj = (_state as Record<string, any>)[key];
    Object.keys(stateObj).forEach(method => {
      if (jest.isMockFunction(stateObj[method])) {
        stateObj[method].mockClear();
      }
    });
  });
};

// 导出模拟的VS Code API
module.exports = {
  // 窗口API
  window: _state.window,
  
  // 工作区API
  workspace: _state.workspace,
  
  // 命令API
  commands: _state.commands,
  
  // 扩展API
  extensions: _state.extensions,
  
  // URI工具
  Uri: {
    file: jest.fn(path => ({ fsPath: path })),
    parse: jest.fn(uri => ({ fsPath: uri })),
  },
  
  // 位置和范围
  Position: jest.fn((line, character) => ({ line, character })),
  Range: jest.fn((start, end) => ({ start, end })),
  
  // 诊断
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  
  // 状态栏项
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
  
  // 内部方法，用于测试
  _reset,
  _state,
};