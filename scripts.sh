npx repomix@latest --ignore ".vscode/, .agent/, .agents/, .github/, docs/, MySQL/, client/, backups/" 

pm2 logs DRDB_v3 --nostream --lines 5000 > error_logs.txt

curl http://drdb.mcmaster.ca:3000/api/appointment/monthYearN