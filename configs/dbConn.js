import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL || "postgres://postgres:Maersk@2021@localhost:5432/postgres",
	ssl: false
});

export {pool}