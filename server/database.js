const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'socialwave'
});

module.exports = {
    query: async function (query, values) {
        let conn;
        try {
            conn = await pool.getConnection();
            const results = await conn.query(query, values);
            conn.release(); // Release the connection back to the pool
            return results;
        } catch (err) {
            if (conn) {
                conn.release(); // Release the connection back to the pool in case of error
            }
            throw err;
        }
    }
};
