/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/__mocks__/vscode.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};