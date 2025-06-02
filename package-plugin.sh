#!/bin/bash

# 设置变量
PLUGIN_ID="mpclipper-sync"

# 创建临时目录
mkdir -p "$PLUGIN_ID"

# 复制文件
cp main.js manifest.json "$PLUGIN_ID/"

# 如果有 styles.css 文件，也复制它
if [ -f styles.css ]; then
    cp styles.css "$PLUGIN_ID/"
fi

# 创建 ZIP 文件
zip -r "$PLUGIN_ID.zip" "$PLUGIN_ID"

# 清理临时目录
rm -rf "$PLUGIN_ID"

echo "插件已打包为 $PLUGIN_ID.zip"
echo "请在 Obsidian 中，进入设置 > 第三方插件 > 从文件安装，然后选择此 ZIP 文件"
