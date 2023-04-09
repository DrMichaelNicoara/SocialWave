const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'socialmediaapp'
})

async function main() {
    try {
        let connection = await pool.getConnection();
        let rows = await connection.query("SELECT * FROM users");
        console.log(rows);
    }
    catch (err) {
        console.log(err);
    }
}
main();