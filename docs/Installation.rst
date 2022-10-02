Installation
=========================

DRDB system from PNB, McMaster University

This is an open source system to manage participant database, study,
study schedules, and research personnels.

How to deploy the system on a Linux (Ubuntu) sever
-----------------------------------------------------

Prerequisites
~~~~~~~~~~~~~~~~

-  Node.js & npm

.. code-block:: shell

    sudo apt update
    sudo apt install nodejs
    sudo apt install npm

-  MySQL 8 Server
    -  Instructions: https://phoenixnap.com/kb/how-to-install-mysql-on-ubuntu-18-04

-  git

.. code-block:: shell

    sudo apt install git

-  nginx

.. code-block:: shell

    sudo apt install nginx

Download the latest version of the system
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: shell

    cd ~
    git clone https://github.com/naiqixiao/DRDB

All frontend and backend codes should be downloaded to "~/DRDB" folder.

MySQL database setup
~~~~~~~~~~~~~~~~~~~~

-  Create a *user* and *password*

.. code-block:: shell

    # in Terminal, enter mysql shell with root
    # if you haven't set password for root, press 'Enter' key when the password prompt shows up.

    mysql -u root -p

.. code-block:: mysql

    # choose your own username and password to replace the following newuser and password respectively.

    CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';

    # provide the user with access to the information they will need.
    # replacing the following newuser with the username that you just created.

    GRANT ALL PRIVILEGES ON * . * TO 'newuser'@'localhost';

    # reload all the privileges

    FLUSH PRIVILEGES;

-  Create a database under the user that you just created.

.. code-block:: shell

    # in Terminal, log in to the MySQL Server using the user just created.

    mysql -u newuser -p

.. code-block:: mysql

    # in MySQL shell, enter the following script to create a database named DRDB.

    CREATE DATABASE IF NOT EXISTS DRDB;

    # quit MySQL shell.

    EXIT

-  Import sample database

.. code-block:: shell

    # in Terminal, import the sample database with the user just created.
    # the sample sql database is in /DRDB/MySQL/Backup.sql
    # the following codes assume you import the sample database under the user named username. Replacing the following newuser with the username that you just created.

    cd ~/DRDB
    mysql -u newuser -p DRDB < MySQL/Backup.sql

    # in Terminal, log in MySQL with the username
    mysql -u newuser -p

.. code-block:: mysql

    # in MySQL, enter the following command to setup automatic Age caculation.

    USE DRDB

    CREATE EVENT
    IF NOT EXISTS age_update
    ON SCHEDULE EVERY 1 Day
    STARTS CURRENT_TIMESTAMP
    DO
    UPDATE DRDB.Child 
        set Age = DATEDIFF(CURDATE(), DoB);

Backend setup and configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  Install all required modules

.. code-block:: shell

    cd ~/DRDB/server
    sudo npm install

-  Set up MySQL database connection
-  open '~/DRDB/server/config/general.js'
-  update *Line 5 with the MySQL username and password* that you created
   in the previous step.
-  for example, the following line indicates username of 'admin' and
   password of 'password'

.. code-block:: javascript

    exports.sequelize = new Sequelize("DRDB", "admin", "password", {
    host: "localhost",
    dialect: "mysql",
    logging: false,
    define: {
        // timestamps: false,
        freezeTableName: true,
    },
    timeZone: "America/Toronto",
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    });

-  Set up the URL of the system
-  open '~/DRDB/server/config/general.js'
-  update *Line 1* with the URL of the system


- Run backend server with pm2

.. code-block:: shell

    cd ~/DRDB/server

    sudo npm install --save pm2 -g

    pm2 start server.js

Frontend setup
~~~~~~~~~~~~~~

install all required modules

.. code-block:: shell

    cd ~/DRDB/client
    sudo npm install

deploy frontend server

.. code-block:: shell

    cd ~/DRDB/client
    npm run build

Configure nginx

Instructions:
https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-18-04

You might need to run the following script to enable firewall

.. code-block:: shell

    sudo ufw enable

Run frontend server with nginx

-  Copy the ready-to-be-deployed frontend codes to ngnix folder

.. code-block:: shell

    cd ~/DRDB/client
    sudo cp -r -T dist /var/www/html/DRDB

-  Configure ngnix

.. code-block:: shell

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

-  Restart ngnix service

.. code-block:: shell

    sudo systemctl restart nginx

You should be able to access the system with the ip address of your
server by now.

How to upgrade the system
-------------------------

.. code-block:: shell

    cd ~/DRDB
    git pull

    # update npm packages for client and server folders
    cd ~/DRDB/client
    npm install

    cd ~/DRDB/server
    npm install

