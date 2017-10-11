const Traceroute 	= require('./lib/traceroute');
const co 			= require('co');
const moment 		= require('moment');
const os 			= require('os');

const MongoClient = require("mongodb").MongoClient;
const mongo_host = process.argv[2];
const url = "mongodb://" + mongo_host + ":27017/procyon";

const sourceInt = os.networkInterfaces().eth1[0].address;
// const sourceInt = "tes";

function funcTraceroute(dest,hop,timeout){
	return new Promise(function (resolve,reject){
		Traceroute.trace(dest,hop,timeout, (err, result) => {

		    if (err) {
		    	console.log(err);
		        throw err;
		    }

		    resolve(result);
		});
	});
}

function getNow(){
	return new Promise(function (resolve,reject){
		resolve(new Date().getTime());
	});
}

function startTraceroute(body) {
	co(function* (){
		const db = yield MongoClient.connect(url);

		// run traceroute
		const traceroute_result = yield funcTraceroute(body.destnation,body.hop,body.timeout);

		const data = {
			"source" : sourceInt,
			"destnation" : body.destnation,
			"timestamp" : getNow(),
			"traceroute" : traceroute_result
		};

		// insert ping result to mongodb
		yield db.collection("traceroute").insertOne(data);
		yield db.close();
		process.send(data);
		process.exit();

	}).catch(function(err){
		process.on('unhandledRejection', console.log(err));
	});

}

process.on("message", function (body) {
    console.log("--- start traceroute");
	startTraceroute(body);
});

process.on("exit", function () {
    console.log("--- end traceroute");
});


console.log(" boot traceroute node");