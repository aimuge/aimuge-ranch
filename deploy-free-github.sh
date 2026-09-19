#!/bin/bash
# ============ 艾牧戈牧场 · GitHub Pages 免费上线（一键） ============
# 前提：有一个免费 GitHub 账号（github.com 注册，2分钟）
set -e
GH=/Users/sun/bin/gh
[ -x "$GH" ] || GH=$(command -v gh || echo /Users/sun/bin/gh)

echo "① 检查 GitHub 登录…"
"$GH" auth status >/dev/null 2>&1 || {
  echo "  请在弹出的浏览器里登录/注册 GitHub，然后点 Authorize 授权（只需一次）"
  "$GH" auth login --hostname github.com --git-protocol https --web
}

USER=$("$GH" api user --jq .login)
REPO=aimuge-ranch
ZIP="/Users/sun/Documents/Codex/2026-08-16/new-chat-3/outputs/aimuge-ranch/艾牧戈智慧牧场-部署包.zip"
TMP=$(mktemp -d)

echo "② 准备网站文件…"
unzip -o -q "$ZIP" -d "$TMP"
cd "$TMP"
git init -q -b main
git add -A
git -c user.email="deploy@aimuge.local" -c user.name="AimuGo Deploy" commit -qm "deploy"

echo "③ 创建 GitHub 仓库并上传…"
if ! "$GH" repo view "$USER/$REPO" >/dev/null 2>&1; then
  "$GH" repo create "$REPO" --public --source . --push --remote origin
else
  git remote add origin "https://github.com/$USER/$REPO.git"
  git push -u origin main
fi

echo "④ 开启 GitHub Pages…"
"$GH" api -X POST "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 || true
sleep 6
URL="https://$USER.github.io/$REPO/"
echo ""
echo "======================================"
echo " ✅ 永久网址（电脑关机也能访问）:"
echo "    $URL"
echo "======================================"
echo "$URL" > "/Users/sun/Documents/Codex/2026-08-16/new-chat-3/outputs/aimuge-ranch/当前公网网址.txt"
