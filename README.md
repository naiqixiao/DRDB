DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnels.

## How to deploy the system on Linux server
### Prerequisites
* NodeJS & npm
```
sudo apt update
sudo apt install nodejs
sudo apt install npm
```
* MySQL 8 Server 
   - Instructions: https://phoenixnap.com/kb/how-to-install-mysql-on-ubuntu-18-04
* git
```
sudo apt install git
```
* nginx
```
sudo apt install nginx
```

### Download the latest version of the system

```
cd ~
git clone https://github.com/naiqixiao/DRDB
```
All frontend and backend codes should be downloaded to "~/DRDB" folder.

### MySQL database setup
* Create a *user* and *password*
```
# in Terminal, enter mysql shell with root 
mysql -u root -p 
```
```
# choose your own username and password to replace the following newuser and password respectively.

mysql>  CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';

# provide the user with access to the information they will need.
# replacing the following newuser with the username that you just created.
mysql>  GRANT ALL PRIVILEGES ON * . * TO 'newuser'@'localhost';
```
```
# reload all the privileges
mysql>  FLUSH PRIVILEGES;
```
* Import sample database
```
# in Terminal, import the sample database with the user just created.
# the sample sql database is in /DRDB/MySQL/Backup.sql
# the following codes assume you import the sample database under the user named username. Replacing the following newuser with the username that you just created.

cd ~/DRDB
mysql -u newuser -p DRDB < MySQL/Backup.sql
```

* Setup daily age update script
```
# participants's ages are supposed to update everyday.
# in Terminal, login to mysql with the username created.

mysql -u newuser -p
```
```
# the following code should be entered in mysql shell, where you should see commend line starts with 'mysql>  '
use DRDB;
DROP EVENT age_update;

CREATE EVENT
IF NOT EXISTS age_update
ON SCHEDULE EVERY 1 Day
STARTS CURRENT_TIMESTAMP
DO
UPDATE DRDB.Child 
    set Age = DATEDIFF(CURDATE(), DoB);
```

### Backend setup and configuration
install all required modules
```
cd ~/DRDB/server
npm install
```
- open '~/DRDB/server/api/models/DRDB.js'
- update Line 4 with the MySQL username and password that you created in the previous step.
- for example, the following line indicates username of 'admin' and password of 'password'

#### Run backend server with pm2
```
cd ~/DRDB/server
pm2 start server.js 
```

### Frontend setup
install all required modules
```
cd ~/DRDB/client
npm install
```
deploy frontend server
```
cd ~/DRDB/client
npm run build
```
#### Configurate nginx
Instructions: https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-18-04

#### Run frontend server with nginx
copy the ready-to-be-deployed frontend codes to ngnix folder
```
cd ~/DRDB/client
sudo cp -r dist /var/www/html/DRDB/
```
restart ngnix
```
sudo systemctl restart nginx
```
You should be able to access the system with the ip address of your server.
## How to upgrade the system
TBD