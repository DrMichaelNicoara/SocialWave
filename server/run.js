var api = require('./api.js').app;
var database = require('./database.js');

api.listen(3000, function () {
    console.log('CORS-enabled web server is listening on port 3000...');
});

function login(username, password, callback) {
    // Perform a query to check if the user exists
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    database.query(query, [username, password])
        .then(results => {
            // Check if user exists
            if (results.length > 0) {
                callback(null, true); // User exists
            } else {
                callback(null, false); // User does not exist
            }
        })
        .catch(err => {
            callback(err);
        });
}
