### PlanMit - a simple tool to design streets and to upload your changes

This project was developed during my Bachelor Thesis in cooperation with the planning office Gertz Gutsche Rümenapp (GGR).

### libraries

It uses Backbone-Require-Boilerplate (BRB) provided by Greg Franko (https://github.com/BoilerplateMVC/Backbone-Require-Boilerplate) and 
jQuery Touch Punch (http://touchpunch.furf.com/).

### Installation guide:

- install Node.js (Linux: sudo apt-get install nodejs)  
- optional: install nodemon ("npm install nodemon -g")
- type "npm install" inside the main folder of this cloned project (if error occures under Linux, try sudo apt-get install nodejs-legacy before)
- if npm install fails to install pg: manually install with "npm install pg.js" inside the main folder (Windows 8 issue in package node-gyp)
- to access the database you need a valid postgres installation, 
- there is a small set of resources to start with, provided under the name of db_dump.sql in the root directory
- to configure the postgres and server connection, edit the ./server/config_example.js and rename it to config.js
- to start the server, type "nodemon" inside the main folder (or "node /server/server.js" if nodemon is not installed)
- to access the index page locally, type in your browser: http://localhost:<port-number> (port defined in config.js)

### License

Copyright (c) 2014 Christoph Franke
Licensed under the GPL license.
