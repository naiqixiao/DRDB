npx repomix@latest --ignore ".vscode/, .agent/, .agents/, .github/, docs/, MySQL/, backups/, DRDB v3/, DRDB_dump.sql" 

pm2 logs DRDB_v3 --nostream --lines 5000 > error_logs.txt