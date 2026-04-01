import { query } from '../configs/dbConn.js';
import fs from 'fs';

const schemaFile = new URL('./schema.sql', import.meta.url);

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

const tables = [
    'items_history',
    'item_rate',
    'item',
    'measurement_unit',
    'history',
    'user_work_log',
    'order_entry',
    'b2b_order_entry',
    'normal_order_entry',
    'entry',
    'customer_account',
    'app_user'
];

await query('SET FOREIGN_KEY_CHECKS = 0');

for (const table of tables) {
    await query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`Dropped ${table}`);
}

await query('SET FOREIGN_KEY_CHECKS = 1');

await runSqlFile(schemaFile);

console.log('Database reset and baseline schema applied successfully.');
