In terminal, run following commands (one by one) from any location:

psql postgres

CREATE USER onroad WITH PASSWORD 'password';

CREATE DATABASE onroad;

\c onroad;

CREATE TABLE users (
id BIGSERIAL PRIMARY KEY NOT NULL,
name VARCHAR(200) NOT NULL,
email VARCHAR(200) NOT NULL,
password VARCHAR(200) NOT NULL,
UNIQUE(email));

CREATE TABLE requests (
keywords JSON,
email VARCHAR(200) NOT NULL,
UNIQUE(email)
);

GRANT ALL PRIVILEGES ON DATABASE onroad TO onroad;
GRANT ALL PRIVILEGES ON TABLE users TO onroad;
GRANT ALL PRIVILEGES ON TABLE requests TO onroad;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO onroad;







