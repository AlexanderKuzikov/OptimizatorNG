@echo off
cd /d "%~dp0"

git fetch origin
git reset --hard origin/Release
npm install
npm start
