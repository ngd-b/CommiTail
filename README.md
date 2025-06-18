
# CommiTail

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

### 配置项说明

- `appendOptions`: 追加选项数组，每个选项都是一个字符串
- `manual`: 是否手动选择追加项
  - `true`: 每次提交时弹出选择框
  - `false`: 使用 `defaultIndex` 指定的选项
- `defaultIndex`: 默认选项的索引（仅在 `manual` 为 `false` 时有效）

### 配置文件验证

CommiTail 会自动验证配置文件的有效性，包括：

- 检查 `appendOptions` 是否为非空数组且每个选项都是字符串
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
