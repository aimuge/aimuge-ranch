#!/bin/bash
# 艾牧戈牧场演示 · 打开当前访问地址
cd "$(dirname "$0")"
URL=$(cat 当前公网网址.txt 2>/dev/null || echo http://127.0.0.1:8123)
open "$URL"
echo "已打开: $URL"
echo "服务由开机自启托管，管理命令: ./aimuge-services.sh start|stop|url|sync"
