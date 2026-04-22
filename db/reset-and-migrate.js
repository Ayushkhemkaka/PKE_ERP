import { getConnection, query } from '../configs/dbConn.js';
import fs from 'fs';

const schemaFile = new URL('./schema.sql', import.meta.url);

const splitSqlStatements = (sql) => {
    const statements = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = 0; index < sql.length; index += 1) {
        const char = sql[index];
        const prev = sql[index - 1];

        if (!inDoubleQuote && char === "'" && prev !== '\\') {
            inSingleQuote = !inSingleQuote;
        } else if (!inSingleQuote && char === '"' && prev !== '\\') {
            inDoubleQuote = !inDoubleQuote;
        }

        if (!inSingleQuote && !inDoubleQuote && char === ';') {
            const trimmed = current.trim();
            if (trimmed) {
                statements.push(trimmed);
            }
            current = '';
            continue;
        }

        current += char;
    }

    const trimmed = current.trim();
    if (trimmed) {
        statements.push(trimmed);
    }

    return statements;
};

const runSqlFile = async (fileUrl) => {
    const sql = fs.readFileSync(fileUrl, 'utf8');
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
        await query(statement);
    }
};

const connection = await getConnection();

try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const [tables] = await connection.query(
        `SELECT table_name AS tableName
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_type = 'BASE TABLE'`
    );

    for (const row of tables) {
        const tableName = row.tableName;
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`Dropped ${tableName}`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
} finally {
    connection.release();
}

await runSqlFile(schemaFile);

console.log('Database reset and baseline schema applied successfully.');
