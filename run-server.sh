#!/bin/bash
# 艾牧戈牧场演示服务器启动器（供开机自启服务调用）
cd "$(dirname "$0")" || exit 1
exec /usr/bin/python3 -m http.server 8123 --bind 0.0.0.0
