const ping 		= require('ping');
const co 		= require('co');
const moment 	= require('moment');
var os 			= require('os');

const MongoClient = require("mongodb").MongoClient;
const mongo_host = process.argv[2];
const url = "mongodb://" + mongo_host + ":27017/procyon";

let db;

function funcPing(dest,timeout,packetsize){
	return new Promise(function (resolve,reject){
		// console.log(target);
		const hosts = [dest];
		hosts.forEach(function (host) {
		    ping.promise.probe(host,{timeout: timeout,extra: ["-s " + packetsize]})
		    // ping.promise.probe(host,{timeout: timeout,extra: ["-s " + packetsize + " - 100"]})
		        .then(function (res) {
		        	// console.log(host);
		            resolve(res);
		        });
		});
	});
}

function startPing(db,body) {
	co(function* (){
		// run ping
		const ping_result = yield funcPing(body.destnation,body.timeout,body.packetsize);

		const value =  {
			"source" : os.networkInterfaces().eth0,
			"destnation" : ping_result.host,
			"destnation_num" : ping_result.numeric_host,
			"time" : ping_result.time,
			"alive" : ping_result.alive,
			"packetsize" : body.packetsize,
			"timestamp" : moment().format(),
			"output" : ping_result.output
		}

		// insert ping result to mongodb
		yield db.collection("ping").insertOne(value);

		process.send(value);

	}).catch(function(err){
		process.on('unhandledRejection', console.log(err));
	});

}

process.on("message", function (body) {
	co(function* (){
	    if(body.sighup){
	    	yield db.close();
	    	console.log("--- end ping");
	    	process.exit();
	    }
	    console.log("--- start ping");
	    db = yield MongoClient.connect(url);
	    setInterval(function() {
		  startPing(db,body);
		}, body.interval);
	}).catch(function(err){
		process.on('unhandledRejection', console.log(err));
	});
});

process.on("close", function () {
    console.log("--- end ping");
});


console.log(" boot ping node");