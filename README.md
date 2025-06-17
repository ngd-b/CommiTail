
# CommiTail

> A GitLens extension to help you append structured suffixes to your commit messages based on custom rules.

CommiTail 是一款 Git 提交辅助插件，它可以在你提交代码时，自动或手动为提交信息追加标识（如 `[skip ci]`、`🔧 chore` 等），提升提交规范性和效率。

---

## ✨ 特性

- ✅ 支持自定义追加项（如 `[skip ci]`, `🧪 test` 等）
- ✅ 支持自动模式（无需手动选择）
- ✅ 支持手动选择追加内容（默认模式）
- ✅ 支持默认使用某个追加项（通过 `defaultIndex` 配置）
- ✅ 与 GitLens、VS Code 原生 SCM 无缝集成

---

## 📦 安装

请先确保已安装 [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)。

1. 克隆本项目或从 Marketplace 安装（开发中）
2. 在 VS Code 中打开项目，按 `F5` 启动调试插件
3. 在源代码管理（SCM）界面右上角点击 `CommiTail: Commit with Append`

---

## ⚙️ 配置

在项目根目录下创建 `commitail.config.json` 配置文件：

```json
{
  "appendOptions": ["[skip ci]", "🔧 chore", "🧪 test", "🚀 deploy"],
  "manual": false,
  "defaultIndex": 1
}
````

### 配置说明

| 字段名             | 类型         | 说明                                             |
| --------------- | ---------- | ---------------------------------------------- |
| `appendOptions` | `string[]` | 提交时可追加的后缀内容（支持 emoji、字符串等）                     |
| `manual`        | `boolean`  | 是否手动选择追加项。为 `false` 时将自动使用 `defaultIndex` 指定的项 |
| `defaultIndex`  | `number`   | 自动模式下使用的默认下标项，默认为 `0`，如果越界将中止提交                |

---

## 🚀 使用方式

1. 正常在 Git 面板输入提交信息（如：`fix: 修复登录异常`）
2. 提交前点击右上角 CommiTail 图标，或命令面板运行 `CommiTail: Commit with Append`
3. 插件将自动或手动为提交信息追加内容，如：

```
fix: 修复登录异常 🔧 chore
```

> ⚠️ 注意：请先输入提交信息，再点击插件执行。若未输入将提示错误。

---

## 🧪 开发调试

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 调试（F5 启动 Extension Development Host）
```

项目结构：

```
.
├── src/extension.ts          // 插件主逻辑
├── commitail.config.json     // 示例配置
├── package.json              // 插件元信息
├── out/                      // 构建产物
└── README.md
```

---

## 📝 License

Apache © 2025 [hboot](https://github.com/ngd-b)

---
