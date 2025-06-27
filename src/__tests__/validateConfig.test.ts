import { validateConfig } from "../utils/config";
import { Config } from "../types";

describe("validateConfig 函数测试", () => {
  test("有效配置应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["[skip ci]", "[wip]"],
      defaultIndex: 0,
      manual: false,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("缺少appendOptions时应该失败", () => {
    const invalidConfig = {
      defaultIndex: 0,
      manual: false,
    } as Config;

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions");
    expect(result.config).toBeUndefined();
  });

  test("appendOptions为空数组时应该失败", () => {
    const invalidConfig: Config = {
      appendOptions: [],
      defaultIndex: 0,
      manual: false,
    };

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions");
    expect(result.config).toBeUndefined();
  });

  test("defaultIndex超出范围时应该失败", () => {
    const invalidConfig: Config = {
      appendOptions: ["[skip ci]", "[wip]"],
      defaultIndex: 5, // 超出数组长度
      manual: false,
    };

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("defaultIndex");
    expect(result.config).toBeUndefined();
  });

  test("defaultIndex为负数时应该失败", () => {
    const invalidConfig: Config = {
      appendOptions: ["[skip ci]", "[wip]"],
      defaultIndex: -1,
      manual: false,
    };

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("defaultIndex");
    expect(result.config).toBeUndefined();
  });

  test("defaultIndex在有效范围内时应该通过", () => {
    const validConfig: Config = {
      appendOptions: ["[skip ci]", "[wip]", "[docs]"],
      defaultIndex: 2, // 在数组范围内
      manual: false,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("没有defaultIndex时应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["[skip ci]", "[wip]"],
      manual: false,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("包含二维数组格式的appendOptions时应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: [
        ["[skip ci]", "跳过CI"],
        ["[wip]", "工作进行中"],
      ],
      defaultIndex: 0,
      manual: true,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("混合格式的appendOptions时应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["[skip ci]", ["[wip]", "工作进行中"], "[docs]"],
      defaultIndex: 1,
      manual: false,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("appendOptions包含空字符串时应该通过验证", () => {
    const validConfig: Config = {
      appendOptions: ["[skip ci]", "", "[wip]"],
      defaultIndex: 0,
      manual: false,
    };

    const result = validateConfig(validConfig);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
    expect(result.config).toEqual(validConfig);
  });

  test("appendOptions包含长度不足的数组时应该失败", () => {
    const invalidConfig = {
      appendOptions: [
        "[skip ci]",
        ["只有一项"], // 长度不足的数组
        "[wip]",
      ],
      defaultIndex: 0,
      manual: false,
    };

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions");
    expect(result.config).toBeUndefined();
  });

  test("appendOptions包含非字符串类型的数组元素时应该失败", () => {
    const invalidConfig = {
      appendOptions: [
        "[skip ci]",
        [123, "描述"], // 第一个元素不是字符串
        "[wip]",
      ],
      defaultIndex: 0,
      manual: false,
    };

    const result = validateConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("appendOptions");
    expect(result.config).toBeUndefined();
  });
});
