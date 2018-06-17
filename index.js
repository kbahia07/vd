const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;

var db;

app.use(express.json());

// connect to database
MongoClient.connect(process.env.DATABASE_URL, function(err, client) {
	if (err) throw err;

	db = client.db('vaultdragondb');
	console.log('Connected to DB');

	// start Web Server
	app.listen(process.env.PORT, function() {
		console.log("Listening on " + process.env.PORT);
	});
});

app.get('/', req);

/**
*
* Endpoint: /object/{key}?timestamp={timestamp} [timestamp optional]
* Method: GET
*
*/
app.get('/object/:key', function(req, res) {

	var findObj = { key : req.params.key };
	var sortObj = { timestamp : -1 };

	// if timestamp is given, add a timestamp filter
	if (req.query.timestamp) {
		findObj = { key : req.params.key, timestamp : { $lte : parseInt(req.query.timestamp) } };
	}

	db.collection('pairs').find(findObj).sort(sortObj).limit(1).toArray(function(err, result) {
		if (err) throw err;

		// send response
		res.status(200).send((result.length > 0) ? { value : result[0].value } : {});
	});
});

/**
*
* Endpoint: /object/{key}
* Method: POST
* Header: Content-Type application/json
* Request: 
*       { key : value }
*
*/
app.post('/object', function(req, res) {

	var pairKey = Object.keys(req.body)[0];
	var pairValue = req.body[Object.keys(req.body)[0]];

	// if (!pairKey) throw 'Empty key';

	var pairObj = { 
					key 		: pairKey, 
					value 		: pairValue,
					timestamp 	: Math.floor(Date.now() / 1000)
				  };

	// save object to database
	db.collection('pairs').insertOne(pairObj, function(err, result) {
		if (err) throw err;

		// delete _id field
		delete result.ops[0]._id;

		// send response
		res.status(200).send(result.ops[0]);
	});
});

// Not Found
app.use((req, res, next) => {
  res.status(404).send("Page not found.")
})

// Something went wrong
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something went wrong.')
})