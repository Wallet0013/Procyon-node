const Traceroute 	= require('traceroute');
const co 			= require('co');
const moment 		= require('moment');
const os 			= require('os');

const MongoClient = require("mongodb").MongoClient;
const mongo_host = process.argv[2];
const url = "mongodb://" + mongo_host + ":27017/procyon";

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

function startTraceroute(body) {
	co(function* (){
		const db = yield MongoClient.connect(url);

		// run traceroute
		const traceroute_result = yield funcTraceroute(body.destnation,body.hop,body.timeout);

		const data = {
			"source" : os.networkInterfaces().eth0,
			"destnation" : body.destnation,
			"timestamp" : moment().format(),
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