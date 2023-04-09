var api = require('./api.js').app;
var database = require('./database.js').pool;

api.listen(3000, function(){
  console.log('CORS-enabled web server is listening on port 3000...');
});
