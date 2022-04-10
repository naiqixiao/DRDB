sudo apt install mysql-server

sudo mysqldump -u [user] -p [database_name] | sed 's/ AUTO_INCREMENT=[0-9]*//g' > [filename].sql
mysqldump -u admin -p --no-data DRDB | sed 's/ AUTO_INCREMENT=[0-9]*//g' > Backup.sql



puttygen ~/.ssh/id_rsa -O private-openssh -o ~/.ssh/oise_id_rsa.pem

