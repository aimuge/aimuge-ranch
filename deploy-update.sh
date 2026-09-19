#!/bin/bash
# ============ 艾牧戈牧场 · 更新上线（改完源码后运行） ============
# 作用：把最新系统文件重新发布到永久网址，网址/二维码不变
set -e
DIR_OUT="/Users/sun/Documents/Codex/2026-08-16/new-chat-3/outputs/aimuge-ranch"
TOKEN_FILE="$HOME/.aimuge-gh-token"
USER="aimuge"
REPO="aimuge-ranch"

echo "① 准备最新文件…"
TMP=$(mktemp -d)
unzip -o -q "$DIR_OUT/艾牧戈智慧牧场-部署包.zip" -d "$TMP"
cd "$TMP"
git init -q -b main
git add -A
git -c user.email="deploy@aimuge.local" -c user.name="AimuGo Deploy" commit -qm "update $(date '+%Y-%m-%d %H:%M')"

echo "② 检查授权令牌…"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "  没有保存的令牌，需要先找 AI 做一次 GitHub 授权（1分钟）"
  echo "  授权后令牌会保存到 $TOKEN_FILE"
  exit 1
fi
TOKEN=$(cat "$TOKEN_FILE")

echo "③ 推送到 GitHub Pages…"
git remote add origin "https://x-access-token:$TOKEN@github.com/$USER/$REPO.git"
git push -u origin main 2>&1 | tail -3

echo ""
echo "======================================"
echo " ✅ 已更新上线，网址不变："
echo "    https://$USER.github.io/$REPO/"
echo "    二维码不用换，别人扫码即见新版"
echo "======================================"
