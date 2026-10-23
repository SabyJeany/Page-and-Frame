import mysql from 'mysql2/promise';

// Pool = several reusable connections, more efficient than one
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export async function testMysql() {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL');
    } catch (error) {
        console.error('❌ MySQL connection error:', error.message);
    }
}

export default db;