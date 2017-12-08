const co 		= require('co');
const moment 	= require('moment');
const os 		= require('os');
const net_ping 	= require('./lib/net-ping');
const microtime = require('microtime')
const BigNumber = require('bignumber.js');

const MongoClient = require("mongodb").MongoClient;
const mongo_host = process.argv[2];
const url = "mongodb://" + mongo_host + ":27017/procyon";

const sourceInt = os.networkInterfaces().eth1[0].address;
// const sourceInt = "tes";


function insertdb(value){
	return new Promise(function (resolve,reject){
		co(function* (){
			const db = yield MongoClient.connect(url);
			yield db.collection("ping").insertOne(value);
			yield db.close();
		}).catch(function(err){
			process.on('unhandledRejection', console.log(err));
		});
	});
}

function startPing(body) {
	co(function* (){
		// run ping
		const options = {
		    packetSize: parseInt(body.packetsize),
		    retries: 0,
		    timeout: parseInt(body.timeout),
		    ttl: parseInt(body.ttl)
		};
		const session = net_ping.createSession (options);
		let destsArray = body.destnation.split(',');

		let resultArray = [];
		for (var i = 0; i < destsArray.length; i++) {
			session.pingHost (destsArray[i], function (error, target,sent, rcvd) {
				const ms = rcvd - sent;
				let alive;
				const value = {
					source : sourceInt,
					destnation:target,
			    	timestamp: new BigNumber(microtime.now(sent)).div(1000).round(0,1).toNumber(),
			    	microsec:ms,
			    	alive : error ? false : true,
			    	error: error ? error.toString() : null
				};
		    	console.log(value);
		    	insertdb(value);
			});
		}

		process.send("ok!");

	}).catch(function(err){
		process.on('unhandledRejection', console.log(err));
	});

}

process.on("message", function (body) {
	co(function* (){
	    if(body.sighup){
	    	console.log("--- end ping");
	    	process.exit();
	    }
	    console.log("--- start ping");
	    setInterval(function() {
		  startPing(body);
		}, body.interval);
	}).catch(function(err){
		process.on('unhandledRejection', console.log(err));
	});
});

process.on("close", function () {
    console.log("--- end ping");
});


console.log(" boot ping node");

// funcPing("8.8.8.8",1000,16,128);
// funcPing("10.135.57.254",1000,16,128);
// funcPing("127.0.0.1",1000,16,128);
