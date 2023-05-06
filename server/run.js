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
                res.send({ error: '', userId: results[0].Id }); // User exists
            } else {
                res.send({ error: "User doesn't exist" }); // User does not exist
            }
        })
        .catch(err => {
            res.send({ error: 'Internal Server Error (500)' });
        });
});

// SignUp endpoint
api.post('/signup', function (req, res) {
    // Validate each field except profilePicture
    const fields = ['firstName', 'lastName', 'email', 'address', 'phoneNumber', 'username', 'password'];
    const errors = [];
    fields.forEach(field => {
        if (!req.body[field]) {
            errors.push(`${field} is required`);
        }
    });

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

    const username = req.body.username;
    // Validate username
    if (username.indexOf(' ') !== -1) {
        errors.push("Username cannot contains spaces.")
    }

    // Check if username already exists
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
                // Insert new user record into the database
                const query = `INSERT INTO users (profilePic, firstName, lastName, email, address, phoneNumber, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                const values = [
                    req.body.profilePic,
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
                        res.send({ error: "", userId: results.insertId.toString() }); // Success
                    })
                    .catch(err => {
                        res.send({ error: err.message });
                    });
            }
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Get all the users a specific user is following
api.get('/following/:userId', function (req, res) {
    const userId = req.params.userId;
    // Perform a query to get all the users the specified user is following
    const query = `SELECT u.Id, u.username FROM follows f
                   INNER JOIN users u ON f.Id_user = u.Id
                   WHERE f.Id_follower = ?`;
    database.query(query, [userId])
        .then(results => {
            res.send({ users: results }); // Return the list of users
        })
        .catch(err => {
            res.send({ error: 'Internal Server Error (500)' });
        });
});

// Get all the users that follow a specific user
api.get('/followers/:userId', function (req, res) {
    const userId = req.params.userId;

    // Perform a query to get all the users that follow the specified user
    const query = `SELECT u.Id, u.username FROM follows f
                   INNER JOIN users u ON f.Id_follower = u.Id
                   WHERE f.Id_user = ?`;
    database.query(query, [userId])
        .then(results => {
            res.send({ users: results }); // Return the list of users
        })
        .catch(err => {
            res.send({ error: 'Internal Server Error (500)' });
        });
});

// Get user data from Id
api.get('/users/:userId', function (req, res) {
    const userId = req.params.userId;

    // Perform a query to retrieve the user with the specified userId
    const query = `SELECT Id, profilePic, firstName, lastName, email, address, phoneNumber, username FROM users WHERE Id = ?`;
    const values = [userId];
    database.query(query, values)
        .then(results => {
            if (results.length > 0) {
                const user = results[0];
                delete user.password; // Remove password from user object
                const buffer = new Buffer(user.profilePic);

                user.profilePic = buffer.toString();
                res.send(user); // Success
            } else {
                res.send(null); // User not found
            }
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Post a new follow entry
api.post('/follow', function (req, res) {
    const userId = req.body.userId;
    const followerId = req.body.followerId;

    // Perform a query to check if the follow entry already exists
    const checkQuery = `SELECT * FROM follows WHERE Id_user = ? AND Id_follower = ?`;
    database.query(checkQuery, [userId, followerId])
        .then(results => {
            if (results.length > 0) {
                res.send({ error: 'Follow entry already exists' });
            } else {
                // Perform a query to insert a new follow entry
                const insertQuery = `INSERT INTO follows (Id_user, Id_follower) VALUES (?, ?)`;
                database.query(insertQuery, [userId, followerId])
                    .then(results => {
                        res.send({ error: '' }); // Success
                    })
                    .catch(err => {
                        res.send({ error: 'Internal Server Error (500)' });
                    });
            }
        })
        .catch(err => {
            res.send({ error: 'Internal Server Error (500)' });
        });
});

// Delete a follow entry
api.delete('/follow', function (req, res) {
    const userId = req.body.userId;
    const followerId = req.body.followerId;

    // Perform a query to delete the follow entry
    const deleteQuery = `DELETE FROM follows WHERE Id_user = ? AND Id_follower = ?`;
    database.query(deleteQuery, [userId, followerId])
        .then(results => {
            if (results.affectedRows === 0) {
                res.send({ error: 'Follow entry not found' });
            } else {
                res.send({ error: '' }); // Success
            }
        })
        .catch(err => {
            res.send({ error: err });
        });
});

// Get all posts which are not from a specific user
api.get('/posts/notfrom/:userId', function (req, res) {
    const userId = req.params.userId;
    // Perform a query to get all posts which are not from the specified user
    const query = `SELECT * FROM posts WHERE Id_user != ?`;
    database.query(query, [userId])
        .then(results => {
            results.forEach(result => {
                if (result.image) {
                    const buffer = new Buffer(result.image);
                    result.image = buffer.toString();
                }
            });
            res.send(results);
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Get all posts from a specific user
api.get('/posts/from/:userId', function (req, res) {
    const userId = req.params.userId;
    // Perform a query to get all posts which are not from the specified user
    const query = `SELECT * FROM posts WHERE Id_user = ?`;
    database.query(query, [userId])
        .then(results => {
            results.forEach(result => {
                if (result.image) {
                    const buffer = new Buffer(result.image);
                    result.image = buffer.toString();
                }
            });
            res.send(results);
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Post a new post
api.post('/posts', function (req, res) {
    const userId = req.body.Id_user;
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current datetime
    const title = req.body.title;
    const content = req.body.content;
    const image = req.body.image;

    if (!userId || !title || !content) { res.send({ error: 'User Id or title or content are empty' }); return;}

    // Perform a query to insert a new post into the database
    const query = `INSERT INTO posts (Id_user, datetime, title, content, image, votes) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [userId, datetime, title, content, image, 0];
    database.query(query, values)
        .then(results => {
            res.send({ error: '', postId: results.insertId }); // Success, send back the postId of the newly created post
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Update a post's votes by postId
api.put('/postVotes/:postId', function (req, res) {
    const postId = req.params.postId;
    const votes = req.body.votes;

    // Perform a query to update the specified post by postId
    const query = `UPDATE posts SET votes = ? WHERE Id = ?`;
    const values = [votes, postId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Update a post by postId
api.put('/posts/:postId', function (req, res) {
    const postId = req.params.postId;
    const title = req.body.title || '';
    const content = req.body.content;
    const image = req.body.image || '';

    // Perform a query to update the specified post by postId
    const query = `UPDATE posts SET title = ?, content = ?, image = ? WHERE Id = ?`;
    const values = [title, content, image, postId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Delete a post by postId
api.delete('/posts/:postId', function (req, res) {
    const postId = req.params.postId;

    // Perform a query to delete the specified post by postId
    const query = `DELETE FROM posts WHERE Id = ?`;
    const values = [postId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Get all comments of a post by postId
api.get('/posts/:postId/comments', function (req, res) {
    const postId = req.params.postId;

    // Perform a query to retrieve all comments of the specified post by postId
    const query = `SELECT * FROM comments WHERE Id_post = ?`;
    const values = [postId];
    database.query(query, values)
        .then(results => {
            res.send(results); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Create a new comment for a post by postId
api.post('/posts/:postId/comments', function (req, res) {
    const postId = req.params.postId;
    const userId = req.body.userId;
    const content = req.body.content;
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current datetime

    if (!content) {
        res.send({ error: "Content is empty" });
        return;
    }

    // Perform a query to insert a new comment for the specified post by postId
    const query = `INSERT INTO comments (Id_user, Id_post, content, datetime) VALUES (?, ?, ?, ?)`;
    const values = [userId, postId, content, datetime];
    database.query(query, values)
        .then(results => {
            res.send({ error: '', commentId: results.insertId }); // Success with the inserted commentId
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Update a comment by commentId
api.put('/comments/:commentId', function (req, res) {
    const commentId = req.params.commentId;
    const content = req.body.content;

    // Perform a query to update the specified comment by commentId
    const query = `UPDATE comments SET content = ? WHERE Id = ?`;
    const values = [content, commentId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Delete a comment by commentId
api.delete('/comments/:commentId', function (req, res) {
    const commentId = req.params.commentId;

    // Perform a query to delete the specified comment by commentId
    const query = `DELETE FROM comments WHERE Id = ?`;
    const values = [commentId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Get all notifications for a specific user, in chronologically ascending order
api.get('/users/:userId/notifications', function (req, res) {
    const userId = req.params.userId;

    // Perform a query to retrieve all notifications for the specified user by userId, sorted by datetime in ascending order
    const query = `SELECT * FROM notifications WHERE Id_user = ? ORDER BY datetime ASC`;
    const values = [userId];
    database.query(query, values)
        .then(results => {
            res.send(results); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Create a new notification for a user by userId
api.post('/users/:userId/notifications', function (req, res) {
    const userId = req.params.userId;
    const title = req.body.title;
    const content = req.body.content;
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current datetime

    // Perform a query to insert a new notification for the specified user by userId
    const query = `INSERT INTO notifications (Id_user, title, content, datetime) VALUES (?, ?, ?, ?)`;
    const values = [userId, title, content, datetime];
    database.query(query, values)
        .then(results => {
            res.send({ error: '', notificationId: results.insertId }); // Success with the inserted notificationId
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});

// Delete a notification by notificationId
api.delete('/notifications/:notificationId', function (req, res) {
    const notificationId = req.params.notificationId;

    // Perform a query to delete the specified notification by notificationId
    const query = `DELETE FROM notifications WHERE Id = ?`;
    const values = [notificationId];
    database.query(query, values)
        .then(results => {
            res.send({ error: '' }); // Success
        })
        .catch(err => {
            res.send({ error: err.message });
        });
});