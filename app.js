const restify 		= require('restify');
const restifyBodyParser = require('restify-plugins').bodyParser;
const server 		= restify.createServer();
server.use(restifyBodyParser());

const ping 			= require('ping');
const co 			= require("co");
const moment 		= require('moment');
const axios 		= require('axios');
const os 			= require('os');

const MongoClient 	= require("mongodb").MongoClient;
const url 			= "mongodb://localhost:27017/procyon";

const child_process = require("child_process");
let ping_node = child_process.fork("./ping",[process.argv[2]]);
let traceroute_node = child_process.fork("./traceroute",[process.argv[2]]);


function startPing(req, res, next) {
	// call ping process
	ping_node.send({
		destnation: req.body.destnation,
		interval : req.body.interval,
		timeout : req.body.timeout,
		packetsize : req.body.packetsize,
		sighup : false
	});

	ping_node.on("message", function (result) {
	    console.log(result);
	});

	res.send({status:"ok"});
}

function stopPing(req, res, next) {
	ping_node.send({ sighup : true});

	ping_node = child_process.fork("./ping",[process.argv[2]]);
	res.send({
		status:"ok",
		message : "complete send to stop ping"
	});
}

function startTraceroute(req, res, next) {
	// call traceroute process
	traceroute_node.send({
		destnation: req.body.destnation,
		hop : req.body.hop,
		timeout : req.body.timeout
	});

	traceroute_node.on("message", function (result) {
	    console.log(result);
	    traceroute_node = child_process.fork("./traceroute",[process.argv[2]]);
	});

	res.send({
		status : "ok",
		message : "complete send to taraceroute "
	});
}


function respond(req, res, next) {
	res.send('test ok');
}

function readyNode(req, res, next) {
	console.log(req.body);
	res.send(
		req.body
	);
}

server.get('/test', respond);
server.post('/ready_node', readyNode);
server.post('/start_ping', startPing);
server.post('/stop_ping', stopPing);
server.post('/start_traceroute', startTraceroute);

server.listen(50001, function() {
	console.log('%s listening at %s', server.name, server.url);
});

axios.post('http://' + process.argv[3] + '/ready_node',{
		firstName: 'Fred',
		node_ip : os.networkInterfaces().eth1
	}).then(function (response) {
		console.log("Procyon node ready for start.");
		// console.log(response);
	}).catch(function (error) {
		console.log("----error");
		console.log(error);
});