import fs from 'fs';
import path from 'path';
import { query } from '../configs/dbConn.js';

const migrationDirectory = new URL('./migrations/', import.meta.url);
const migrationFiles = fs.readdirSync(migrationDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

for (const fileName of migrationFiles) {
    const migrationSql = fs.readFileSync(new URL(fileName, migrationDirectory), 'utf8');
    const statements = migrationSql
        .split(/;\s*\n/)
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await query(statement);
    }

    console.log(`Applied migration ${path.basename(fileName)}`);
}

console.log('Migration applied successfully.');
