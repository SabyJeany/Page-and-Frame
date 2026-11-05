import mysql from 'mysql2/promise'; // Import the mysql2 in its "promise" version, so we can use async/await

/** 
 * Pool = several reusable connections, more efficient than opening a new one each time.
 * All the connection details are stored in .env (never written in the code).
*/
const db = mysql.createPool({
    host: process.env.DB_HOST, // Server address, for exemple "loclhost"
    user: process.env.DB_USER, // MySQL user, for example "root"
    password: process.env.DB_PASSWORD, // MySQL password
    database: process.env.DB_NAME, // Database name e.g. "pageandframe"
});

/**
 * chekcs that MySQL answers, when the server starts.
 * 
 * @returns
 */

export async function testMysql() {
    try {
        // Send a simple query to MySQL, just to check that it answers if Mysql answers, the connections works
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL');
    } catch (error) {
        // wrong password, MySQL not started ...: log the reason
        console.error('❌ MySQL connection error:', error.message);
    }
}
// Export the pool: every model imports it to run queries (db.execute, db.query, etc.)
export default db;