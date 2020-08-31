sudo apt install mysql-server

sudo mysqldump -u [user] -p [database_name] > [filename].sql
sudo mysqldump -u admin -p DRDB > SampleDB_MySQL8.sql

puttygen ~/.ssh/id_rsa -O private-openssh -o ~/.ssh/oise_id_rsa.pem
