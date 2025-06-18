import * as vscode from "vscode";
import * as fs from "fs";
import { validateConfig, Config, ValidationResult } from "../extension";

describe("validateConfig 函数测试", () => {
  // 有效配置测试
  test("有效配置应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["feat", "fix", "docs"],
      manual: false,
      defaultIndex: 0,
    };

    const result = validateConfig(validConfig);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  // appendOptions 测试
  test("appendOptions 不是数组时应该返回错误", () => {
    const invalidConfig = {
      appendOptions: "not an array",
      manual: false,
      defaultIndex: 0,
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions 必须是一个数组");
  });

  test("appendOptions 为空数组时应该返回错误", () => {
    const invalidConfig: Config = {
      appendOptions: [],
      manual: false,
      defaultIndex: 0,
    };

    const result = validateConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions 不能为空数组");
  });

  test("appendOptions 包含非字符串元素时应该返回错误", () => {
    const invalidConfig = {
      appendOptions: ["feat", 123, "docs"],
      manual: false,
      defaultIndex: 0,
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions 中的所有元素必须是字符串");
  });

  // manual 测试
  test("manual 不是布尔值时应该返回错误", () => {
    const invalidConfig = {
      appendOptions: ["feat", "fix", "docs"],
      manual: "not a boolean",
      defaultIndex: 0,
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("manual 必须是一个布尔值");
  });

  // defaultIndex 测试
  test("defaultIndex 不是数字时应该返回错误", () => {
    const invalidConfig = {
      appendOptions: ["feat", "fix", "docs"],
      manual: false,
      defaultIndex: "not a number",
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("defaultIndex 必须是一个数字");
  });

  test("defaultIndex 超出范围时应该返回错误", () => {
    const invalidConfig: Config = {
      appendOptions: ["feat", "fix", "docs"],
      manual: false,
      defaultIndex: 5,
    };

    const result = validateConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("defaultIndex 超出范围");
  });

  test("defaultIndex 为负数时应该返回错误", () => {
    const invalidConfig: Config = {
      appendOptions: ["feat", "fix", "docs"],
      manual: false,
      defaultIndex: -1,
    };

    const result = validateConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("defaultIndex 超出范围");
  });
});
