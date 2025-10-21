# Database (MongoDB)

This directory contains the MongoDB Dockerfile and init scripts for the ShadowMe project.

Credentials seeded by `database/init/init-mongo.js`:

- Root admin user
	- username: `admin`
	- password: `adminpass`

- Application database and user
	- database: `shadowme`
	- username: `shadowuser`
	- password: `shadowpass`

Connection string examples (from other services in docker-compose):

- From backend (container):
	- mongodb://shadowuser:shadowpass@database:27017/shadowme?authSource=admin

- From host (if port 27017 is published):
	- mongodb://shadowuser:shadowpass@localhost:27017/shadowme?authSource=admin

If you want to change credentials, update `database/init/init-mongo.js` and the `docker-compose.yml` environment variables, then recreate the volume (or remove and re-create the data volume) to re-run the init scripts.

