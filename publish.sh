#!/usr/bin/env bash
# 发布 VS Code 插件到 Marketplace 的脚本
# 使用说明：
#   1. (可选) 未执行 vsce login 时，可在环境变量 VSCE_PAT 中配置 Token。
#   2. 保证项目根目录下已经执行过 `npm install` 并且安装了 devDependencies。
#   3. 运行本脚本： ./publish.sh
#
# 脚本将执行以下步骤：
#   - 编译 TypeScript 代码
#   - 使用 vsce CLI 将扩展发布到 VS Code Marketplace。
#
# 如果你还想发布到 Open VSX，只需添加 OVSX_TOKEN 环境变量并取消相应命令的注释即可。

set -euo pipefail

# 如未执行 vsce login 且 VSCE_PAT 未设置，vsce 将提示交互式登录或者失败。

# 确保依赖已安装
npm install --silent

# 发布新版本
npx bumpp --no-push

# 编译扩展
npm run compile

# 打包扩展
npx vsce package

# 发布到 VS Code Marketplace
# 如果已设置 VSCE_PAT 则使用，否则让 vsce 读取登录缓存或交互式处理
if [[ -n "${VSCE_PAT:-}" ]]; then
  npx vsce publish -p "$VSCE_PAT"
else
  npx vsce publish
fi

echo "✅ 扩展已发布到 VS Code Marketplace"

# 如果需要同步发布到 Open VSX，取消下面两行的注释
# if [[ -n "${OVSX_TOKEN:-}" ]]; then
#   npx ovsx publish -p "$OVSX_TOKEN" "$@"
# fi
