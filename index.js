const 
	crypto = require('crypto'),
	express = require('express'),
	bodyParser = require('body-parser'),
	request = require('request'),
	response =  require('response'),
      	restful = require('node-restful'),
        config = require('config'),
        tediousExpress = require('express4-tedious'),
	TYPES = require('tedious').TYPES;
const
	VERIFY_TOKEN = process.env.VERIFY_TOKEN,
	ACCESS_TOKEN = process.env.ACCESS_TOKEN,
	APP_SECRET = process.env.APP_SECRET,
	DATABASE_URL = process.env.DATABASE_URL;

if (!(APP_SECRET && VERIFY_TOKEN && ACCESS_TOKEN && DATABASE_URL)) {
	console.error('Missing environment values.');
	process.exit(1);
}

var app = express();
app.set('port', process.env.PORT || 3000);
//console.log('Port used' + process.env.PORT);
//app.use(bodyParser.json());
console.log('Before');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
console.log('after');
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true}));

//app.use(bodyParser.json({type:'application/vnd.api+json'}));
//app.set('views', __dirname + '/views');
//app.set('view engine', 'json');

//using the expresstedious for the restapi
app.use(function (req, res, next) {
    req.query = tediousExpress(req, config.get('connection'));
    next();
});

app.post("/", function (req, res) {
  //console.log(req.body);
console.log('JSON stringigfy'+JSON.stringify(req.body));
var body = JSON.parse(JSON.stringify(req.body));
	console.log('Extracted data is'+body.CurrentMission.MissionId);
	console.log('Other object array length'+body.OtherMissions.length);
    req.query("exec insertmission @mission")
        .param('mission', JSON.stringify(req.body), TYPES.NVarChar)
        .exec(res);
	res.status(200).send(req.body);
  //res.send(200, req.body);
});

//app.use('/mission', require('./routes/mission'));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found: '+ req.method + ":" + req.originalUrl);
    err.status = 404;
    next(err);
});

// List out all the thanks recorded in the database
//tedious = require('tedious');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

var connection = new Connection(config.get('connection'));

app.get('/', function (request, response) {
// Attempt to connect and execute queries if connection goes through
connection.on('connect', function(err) {
    if (err) {
        console.log(err);
    }
    else{
console.log('Reading rows from the Table...');

    // Read all rows from table
    var request = new Request(
        "SELECT * FROM thanks", function(err, rowCount, rows) {
		if (err) { 
				console.error(err); response.send('Error ' + err);
				
			} else {
				console.log(rowCount + ' row(s) returned');
				response.send('Number of rows returned: '+rowCount);
				//request.on('done',function(rowCount, more, rows){
        			//console.log(rows+'is returned'); // not empty
				//response.render('pages/thanks.ejs', {results: rows} );
				//});
			}     
        }
    );
    request.on('row', function(columns) {
        columns.forEach(function(column) {
            console.log("%s\t%s", column.metadata.colName, column.value);
        });
    });
	console.log('Trace2');
    connection.execSql(request);
	
    }
});
});


// Handle the webhook subscription request from Facebook
app.get('/webhook', function(request, response) {
	console.log(request.query['hub.mode']);
	console.log(request.query['hub.verify_token']);
	if (request.query['hub.mode'] === 'subscribe' &&
		request.query['hub.verify_token'] === VERIFY_TOKEN) {
		console.log('Validated webhook');
		response.status(200).send(request.query['hub.challenge']);
	} else {
		console.log('INside else');
		console.error('Failed validation. Make sure the validation tokens match.');
		response.sendStatus(403);          
	}
});

// Handle webhook payloads from Facebook
app.post('/webhook', function(request, response) {
	if(request.body && request.body.entry) {
		request.body.entry.forEach(function(entry){
			entry.changes.forEach(function(change){
	console.log('handle webhook trace1 '+change.field);
				if(change.field === 'mention') {
					let mention_id = (change.value.item === 'comment') ? 
						change.value.comment_id : change.value.post_id;
					// Like the post or comment to indicate acknowledgement
					graphapi({
						url: '/' + mention_id + '/likes',
						method: 'POST'
					}, function(error,res,body) {
						console.log('Like', mention_id, body);
					});
					// Get mention text from Graph API
					graphapi({
						url: '/' + mention_id,
						qs: {
							fields: 'from,message,message_tags,permalink_url'
						}
					}, function(error,res,body){
						if(body) {
							let message = body.message,
								sender = body.from.id,
								permalink_url = body.permalink_url,
								recipients = [],
								managers = [],
								query_inserts = [];

							body.message_tags.forEach(function(message_tag){
								// Ignore page / group mentions
								if(message_tag.type !== 'user') return;
								// Add the recipient to a list, for later retrieving their manager
								recipients.push(message_tag.id);
							});
							// Get recipients' managers in bulk using the ?ids= batch fetching method
							graphapi({
								url: '/',
								qs: {
									ids: recipients.join(','),
									fields: 'managers'
								}
							}, function(error,res,body){
								// Add a data row for the insert query
								console.log('Managers', body);
								recipients.forEach(function(recipient){
									// Check if we found their manager
									let manager = '';
									if(body 
										&& body[recipient] 
										&& body[recipient].managers 
										&& body[recipient].managers.data[0]) 
										manager = body[recipient].managers.data[0].id;
									managers[recipient] = manager;
									query_inserts.push(`(getdate(),'${permalink_url}','${recipient}','${manager}','${sender}','${message}')`);
								});
								var interval = '1 week';
								let query = 'INSERT INTO thanks VALUES ' 
									+ query_inserts.join(',')
									+`;`;
								console.log('Query', query);
								//pg.connect(DATABASE_URL, function(err, client, done) {
									connection.on('connect', function(err) {
										 if (err) {
												console.log(err);
											  }
										else{
											console.log('Inserting into the Table...');
										}
									//client.query(query, function(err, result) {
									request = new Request(query, function(err, rowCount, rows) {
										//done();
										if (err) { 
											console.error(err); 
										} else if (result) {
											var summary = 'Thanks received!\n';
											// iterate through result rows, count number of thanks sent
											var sender_thanks_sent = 0;
											result.rows.forEach(function(row){
												if(row.sender == sender) sender_thanks_sent++;
											});
											summary += `@[${sender}] has sent ${sender_thanks_sent} thanks in the last ${interval}\n`;

											// Iterate through recipients, count number of thanks received
											recipients.forEach(function(recipient){
												let recipient_thanks_received = 0;
												result.rows.forEach(function(row){
													if(row.recipient == recipient) recipient_thanks_received++;
												});
												if(managers[recipient]) {
													summary += `@[${recipient}] has received ${recipient_thanks_received} thanks in the last ${interval}. Heads up to @[${managers[recipient]}].\n`;
												} else {
													summary += `@[${recipient}] has received ${recipient_thanks_received} thanks in the last ${interval}. I don't know their manager.\n`;
												}
											});
											// Comment reply with thanks stat summary
											graphapi({
												url: '/' + mention_id + '/comments',
												method: 'POST',
												qs: {
													message: summary
												}
											}, function(error,res,body) {
												console.log('Comment reply', mention_id, body);
											});
										}
										response.sendStatus(200);
									});
									console.log('Trace');
									connection.execSql(request);
								});
							});
						}
					});
				}
			});
		});
	}
});


app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

var graphapi = request.defaults({
	baseUrl: 'https://graph.facebook.com',
	json: true,
	auth: {
		'bearer' : ACCESS_TOKEN
	}
});

function verifyRequestSignature(req, res, buf) {
	var signatureHash = req.headers['x-hub-signature'];
console.log('inside validate signatire');
	if (!signature) {
		// For testing, let's log an error. In production, you should throw an error.
		console.error("Couldn't validate the signature.");
		console.log("Couldn't validate the signature");
	} else {
		//var elements = signature.split('=');
		//var signatureHash = elements[1];
console.log("Signature hash is "+signatureHash);
		var expectedHash = crypto.createHmac('sha1', APP_SECRET)
			.update(buf)
			.digest('hex');
console.log("expected hash is "+expectedHash);
		if (signatureHash != expectedHash) {
			console.log("Couldn't validate the request signature.");
			throw new Error("Couldn't validate the request signature.");
			
		}
	}
}
