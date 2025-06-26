
# CommiTail

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/hboot.commitail.svg?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=hboot.commitail)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/hboot.commitail.svg)](https://marketplace.visualstudio.com/items?itemName=hboot.commitail)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ngd-b/CommiTail/release.yml?label=build)](https://github.com/ngd-b/CommiTail/actions)

<p align="center">
  <img src="/icon.png" alt="CommiTail Logo" width="128" />
</p>

CommiTail 是一个 VS Code 扩展，用于为 Git 提交信息追加标识。

## 特性

- 支持自定义追加项
- 支持自动/手动模式
- 支持设置默认追加项
- 与 GitLens 集成

## 安装

### 前置条件

- VS Code 1.78.0 或更高版本
- 已安装 Git 扩展

### 安装方法

1. 克隆本仓库或从 VS Code Marketplace 安装
2. 按 F5 启动调试

## 配置

在工作区根目录创建 `commitail.config.json` 文件，内容如下：

```json
{
  "appendOptions": ["[skip ci]", "🔧 chore", "🧪 test", "🚀 deploy"],
  "manual": true,
  "defaultIndex": 0
}
```

### 配置文件验证

CommiTail 会自动验证配置文件的有效性，包括：

- 检查 `appendOptions` 是否为非空数组，且每个元素为字符串或 `[值, 描述]` 数组
- 检查 `manual` 是否为布尔值
- 检查 `defaultIndex` 是否为有效的整数且在 `appendOptions` 数组范围内

如果配置文件无效，CommiTail 会显示详细的错误信息，并提供创建默认配置的选项。

### 创建默认配置

您可以通过以下方式创建默认配置文件：

1. 使用命令面板（Ctrl+Shift+P 或 Cmd+Shift+P）执行 `CommiTail: Create Default Configuration` 命令
2. 当配置文件不存在或无效时，点击错误消息中的 "创建示例配置" 按钮

## 使用方法

1. 在 Git 提交输入框中输入提交信息
2. 点击 CommiTail 图标或运行 `CommiTail: Commit with Append` 命令
3. 如果 `manual` 为 `true`，选择要追加的后缀
4. CommiTail 会自动将选择的后缀追加到提交信息中并执行提交

## 命令 (Command Palette)

| Command | 说明 |
|---------|------|
| `CommiTail: Commit with Append` (`commitail.commitWithAppend`) | 在当前提交信息后追加后缀（自动或手动） |
| `CommiTail: Create Default Configuration` (`commitail.createConfig`) | 在工作区根目录生成 `commitail.config.json` 默认配置文件 |

## 配置选项 (`commitail.config.json`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `appendOptions` | `string[] \| [string,string][]` | `["[skip ci]", "🔧 chore", "🧪 test", "🚀 deploy"]` | 提供可选的后缀列表；二维数组形式可额外指定描述文本 |
| `manual` | `boolean` | `true` | 是否每次弹出选择框手动选择；`false` 时自动使用 `defaultIndex` 指定的项 |
| `defaultIndex` | `number` | `0` | 当 `manual=false` 时，默认选中的 `appendOptions` 索引 |

## 交互流程

### 自动模式 (`manual = false`)

1. 在 SCM 输入框编写提交信息。
2. 直接点击 **CommiTail 图标** 或运行 `Commit with Append`。
3. 扩展自动在提交信息尾部追加 `appendOptions[defaultIndex]` 指定的后缀并执行 `git commit`。

### 手动模式 (`manual = true`)

1. 编写提交信息并执行命令。
2. Quick Pick 弹窗展示所有 `appendOptions`（若为二维数组则显示描述）。
3. 选择一个后缀后立即追加到提交信息中；若已存在同样后缀则提示并不重复添加。
