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
                res.send({ error: '' }); // User exists
            } else {
                res.send({ error: "User doesn't exist" }); // User does not exist
            }
        })
        .catch(err => {
            res.send({ error: 'Internal Server Error (500)' });
        });
});

// Signup endpoint
api.post('/signup', function (req, res) {
    // Validate each field except profilePicture
    const fields = ['firstName', 'lastName', 'email', 'address', 'phoneNumber', 'username', 'password'];
    const errors = [];
    fields.forEach(field => {
        if (!req.body[field]) {
            errors.push(`${field} is required`);
        }
    });

    // Validate profilePicture extension
    if (req.body.profilePic) {
        const allowedExtensions = ['jpg', 'jpeg', 'png'];
        const profilePic_list = req.body.profilePic.split('.');
        const fileExtension = profilePic_list[profilePic_list.length - 1];
        if (!allowedExtensions.includes(fileExtension)) {
            errors.push("Profile picture must have a jpg, jpeg, or png extension.");
        }
    }

    // Validate firstName and lastName
    const nameRegex = /^[a-zA-Z\s]+$/;
    ['firstName', 'lastName'].forEach(field => {
        if (!nameRegex.test(req.body[field])) {
            errors.push(`${field} must only contain letters or spaces.`);
        }
    });

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        errors.push("Email is not valid.");
    }

    // Validate phoneNumber
    const phoneNumberRegex = /^\d{10}$/;
    if (!phoneNumberRegex.test(req.body.phoneNumber)) {
        errors.push("Phone number must be 10 digits long and contain only digits.");
    }

    // Check if username already exists
    const username = req.body.username;
    const checkUsernameQuery = `SELECT * FROM users WHERE username = ?`;
    database.query(checkUsernameQuery, [username])
        .then(results => {
            if (results.length > 0) {
                errors.push("Username already exists.");
            }

            if (errors.length > 0) {
                // If there are any errors, send them to the client
                res.send({ error: errors.join(", ") });
            } else {
                // If there are no errors, insert new user record into the database
                const query = `INSERT INTO users (profilePic, firstName, lastName, email, address, phoneNumber, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                const values = [
                    null,
                    req.body.firstName,
                    req.body.lastName,
                    req.body.email,
                    req.body.address,
                    req.body.phoneNumber,
                    req.body.username,
                    req.body.password
                ];
                database.query(query, values)
                    .then(results => {
                        res.send({ error: "" }); // Success
                    })
                    .catch(err => {
                        res.send({ error: err });
                    });
            }
        })
        .catch(err => {
            res.send({ error: err });
        });
});
