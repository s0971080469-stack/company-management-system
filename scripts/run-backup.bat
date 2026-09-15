@echo off
cd /d "%~dp0.."
node scripts\backup-to-nas.mjs >> scripts\backup.log 2>&1
