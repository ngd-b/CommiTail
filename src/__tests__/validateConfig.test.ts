import { validateConfig } from "../utils/config";
import { Config } from "../types";

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
      manual: true,
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain(
      "appendOptions 中的元素必须是字符串或长度为2的字符串数组"
    );
  });

  // 二维数组支持测试
  test("appendOptions 包含 [值, 描述] 时应通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["feat", ["fix", "修复bug"], "docs"],
      defaultIndex: 1,
    };
    const result = validateConfig(validConfig);
    expect(result.isValid).toBe(true);
  });

  test("appendOptions 中的子数组长度不足时应返回错误", () => {
    const invalidConfig = {
      appendOptions: ["feat", ["fix"], "docs"],
      manual: true,
    };

    const result = validateConfig(invalidConfig as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain(
      "appendOptions 中的元素必须是字符串或长度为2的字符串数组"
    );
  });

  // manual 测试
  test("manual 不是布尔值时应该返回错误", () => {
    const invalidConfig = {
      appendOptions: ["feat", "fix", "docs"],
      manual: "not a boolean",
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
