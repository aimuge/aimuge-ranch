#!/bin/bash
# ============ 艾牧戈牧场演示服务管理（开机自启版） ============
# 用法: ./aimuge-services.sh start | stop | url | sync
DIR_OUT="/Users/sun/Documents/Codex/2026-08-16/new-chat-3/outputs/aimuge-ranch"
DIR_LIVE="/Users/Shared/aimuge-ranch"
LABEL_S=com.aimuge.ranch-server
LABEL_T=com.aimuge.ranch-tunnel
PLIST_S="$HOME/Library/LaunchAgents/$LABEL_S.plist"
PLIST_T="$HOME/Library/LaunchAgents/$LABEL_T.plist"
UID_N=$(id -u)

case "$1" in
  start)
    launchctl bootstrap gui/$UID_N "$PLIST_S" 2>/dev/null || launchctl load -w "$PLIST_S"
    launchctl bootstrap gui/$UID_N "$PLIST_T" 2>/dev/null || launchctl load -w "$PLIST_T"
    echo "✅ 服务已启动（开机也会自动运行）"
    sleep 15
    "$0" url
    ;;
  stop)
    launchctl bootout gui/$UID_N/$LABEL_S 2>/dev/null || launchctl unload -w "$PLIST_S"
    launchctl bootout gui/$UID_N/$LABEL_T 2>/dev/null || launchctl unload -w "$PLIST_T"
    echo "🛑 服务已停止"
    ;;
  url)
    URL=$(grep -oE 'https://[a-z0-9]+\.lhr\.life' /tmp/aimuge-tunnel.log 2>/dev/null | tail -1)
    if [ -n "$URL" ]; then
      echo "🌐 公网地址(发给别人): $URL"
      echo "$URL" > "$DIR_OUT/当前公网网址.txt"
      echo "📄 已保存到 $DIR_OUT/当前公网网址.txt"
    else
      echo "⚠️  还没拿到公网地址，等 20 秒再执行: ./aimuge-services.sh url"
    fi
    echo "💻 本机地址: http://127.0.0.1:8123"
    ;;
  sync)
    echo "🔄 正在同步最新系统文件到运行目录…"
    cp -R "$DIR_OUT/." "$DIR_LIVE/" && rm -rf "$DIR_LIVE/preview"
    launchctl kickstart -k gui/$UID_N/$LABEL_S 2>/dev/null || launchctl bootout gui/$UID_N/$LABEL_S 2>/dev/null; launchctl bootstrap gui/$UID_N "$PLIST_S" 2>/dev/null
    echo "✅ 已同步并重启服务"
    "$0" url
    ;;
  *)
    echo "用法: ./aimuge-services.sh start | stop | url | sync"
    ;;
esac
