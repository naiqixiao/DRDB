DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study, study schedules, and research personnels.

## How to deploy the system on Linux server

### Prerequisites

- NodeJS & npm

```
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

- MySQL 8 Server
  - Instructions: https://phoenixnap.com/kb/how-to-install-mysql-on-ubuntu-18-04
- git

```
sudo apt install git
```

- nginx

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

- Create a _user_ and _password_

```
# in Terminal, enter mysql shell with root
# if you haven't set password for root, press 'Enter' key when the password prompt shows up.

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

- Create a database under the user that you just created.

```
# in Terminal, log in to the MySQL Server using the user just created.
mysql -u newuser -p
```

```
# in MySQL shell, enter the following script to create a database named DRDB.

mysql>  CREATE DATABASE IF NOT EXISTS DRDB;
```

```
# quit MySQL shell.

mysql>  EXIT
```

- Import sample database

```
# in Terminal, import the sample database with the user just created.
# the sample sql database is in /DRDB/MySQL/Backup.sql
# the following codes assume you import the sample database under the user named username. Replacing the following newuser with the username that you just created.

cd ~/DRDB
mysql -u newuser -p DRDB < MySQL/Backup.sql
```

- Setup daily age update script

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

- Install all required modules

```
cd ~/DRDB/server
sudo npm install
```

- open '~/DRDB/server/api/models/DRDB.js'
- update Line 4 with the MySQL username and password that you created in the previous step.
- for example, the following line indicates username of 'admin' and password of 'password'

#### Run backend server with pm2

```
cd ~/DRDB/server

sudo npm install --save pm2 -g

pm2 start server.js
```

### Frontend setup

install all required modules

```
cd ~/DRDB/client
sudo npm install
```

deploy frontend server

```
cd ~/DRDB/client
npm run build
```

#### Configure nginx

Instructions: https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-18-04

##### You might need to run the following script to enable firewall

```
sudo ufw enable
```

#### Run frontend server with nginx

- Copy the ready-to-be-deployed frontend codes to ngnix folder

```
cd ~/DRDB/client
sudo cp -r -T dist /var/www/html/DRDB
```

- Configure ngnix

```
# Use the following script to configure ngnix services

sudo nano /etc/nginx/sites-available/default

# Change 'root /var/www/html;' to 'root /var/www/html/DRDB;'

# Change ' location / {} ' to 

location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

- Restart ngnix service
```
sudo systemctl restart nginx
```

You should be able to access the system with the ip address of your server by now.

## How to upgrade the system

TBD
