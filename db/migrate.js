import fs from 'fs';
import path from 'path';
import { query } from '../configs/dbConn.js';

const runSqlFile = async (fileUrl) => {
    const sql = fs.readFileSync(fileUrl, 'utf8');
    const statements = sql
        .split(/;\s*\n/)
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await query(statement);
    }
};

const migrationMode = process.env.DB_MIGRATION_MODE || 'baseline';
const schemaFile = new URL('./schema.sql', import.meta.url);

if (migrationMode !== 'legacy' && fs.existsSync(schemaFile)) {
    await runSqlFile(schemaFile);
    console.log(`Applied baseline schema ${path.basename(schemaFile.pathname)}`);
    console.log('Migration applied successfully.');
    process.exit(0);
}

const migrationDirectory = new URL('./migrations/', import.meta.url);
const migrationFiles = fs.readdirSync(migrationDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

for (const fileName of migrationFiles) {
    await runSqlFile(new URL(fileName, migrationDirectory));
    console.log(`Applied migration ${path.basename(fileName)}`);
}

console.log('Migration applied successfully.');
