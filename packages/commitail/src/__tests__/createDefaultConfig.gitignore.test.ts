import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createDefaultConfig } from '../extension';

// mock fs with appendFileSync capability
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// workspace mock
Object.defineProperty(vscode.workspace, 'workspaceFolders', {
  get: () => [
    { uri: { fsPath: '/mock/workspace' }, name: 'mock', index: 0 },
  ],
});

jest.spyOn(vscode.window, 'showInformationMessage');

const mockedFs = fs as unknown as {
  writeFileSync: jest.Mock;
  appendFileSync: jest.Mock;
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
};

describe('createDefaultConfig .gitignore 逻辑', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('首次创建时应向 .gitignore 追加条目', async () => {
    mockedFs.existsSync.mockImplementation((p: string) => {
      // .gitignore 不存在, config 文件不存在
      return false;
    });

    await createDefaultConfig();

    const gitignorePath = path.join('/mock/workspace', '.gitignore');
    expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
      gitignorePath,
      expect.stringContaining('commitail.config.json')
    );
  });

  test('已包含条目时不应重复写入', async () => {
    mockedFs.existsSync.mockImplementation((p: string) => {
      if (p.endsWith('.gitignore')) return true;
      return false;
    });
    mockedFs.readFileSync.mockReturnValue('commitail.config.json\n');

    await createDefaultConfig();

    expect(mockedFs.appendFileSync).not.toHaveBeenCalled();
  });
});
