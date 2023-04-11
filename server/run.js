var api = require('./api.js').app;
var database = require('./database.js');

api.listen(3000, function () {
    console.log('CORS-enabled web server is listening on port 3000...');
});

// Login endpoint
api.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    // Perform a query to check if the user exists
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    database.query(query, [username, password])
        .then(results => {
            // Check if user exists
            if (results.length > 0) {
                res.send({ success: true }); // User exists
            } else {
                res.send({ success: false }); // User does not exist
            }
        })
        .catch(err => {
            res.status(500).send({ error: 'Internal Server Error' });
        });
});
