import mysql from 'mysql2/promise';

const pool = mysql.createPool({
	host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
	port: Number(process.env.PGPORT || process.env.DB_PORT || 3306),
	user: process.env.PGUSER || process.env.DB_USER || 'root',
	password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
	database: process.env.PGDATABASE || process.env.DB_NAME || '',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

const query = async (sql, params = []) => {
	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getConnection = async () => pool.getConnection();

export { pool, query, getConnection }
