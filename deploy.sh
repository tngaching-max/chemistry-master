#!/bin/bash

echo "1. 清理舊檔案..."
rm -rf node_modules package-lock.json dist

echo "2. 安裝依賴..."
npm install

echo "3. 測試建置..."
npm run build

echo "4. 檢查建置結果..."
if [ -d "dist" ]; then
    echo "✅ 建置成功！dist 資料夾已建立"
    ls -la dist/
else
    echo "❌ 建置失敗"
    exit 1
fi

echo "5. 準備推送..."
git add .
git commit -m "準備部署到 Netlify"
git push origin main

echo "✅ 部署指令已完成！請檢查 Netlify 部署狀態"
