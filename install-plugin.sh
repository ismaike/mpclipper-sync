#!/bin/bash

# 设置变量
PLUGIN_ID="mpclipper-sync"
VAULT_PATH="$HOME/Documents/Obsidian/YourVaultName"  # 替换为您的保险库路径

# 创建插件目录
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"
mkdir -p "$PLUGIN_DIR"

# 复制文件
cp main.js manifest.json "$PLUGIN_DIR"

# 如果有 styles.css 文件，也复制它
if [ -f styles.css ]; then
    cp styles.css "$PLUGIN_DIR"
fi

echo "插件已安装到 $PLUGIN_DIR"
echo "请重启 Obsidian 或刷新插件列表，然后在设置中启用该插件"
