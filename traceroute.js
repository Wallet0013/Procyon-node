const Traceroute 	= require('./lib/traceroute');
const co 			= require('co');
const moment 		= require('moment');
const os 			= require('os');
const microtime 	= require('microtime')
const MongoClient 	= require("mongodb").MongoClient;
const BigNumber 	= require('bignumber.js');


const mongo_host 	= process.argv[2];
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
		let destsArray = body.destnation.split(',');
		for(let i = 0; i <= destsArray.length; i++){
			const traceroute_result = yield funcTraceroute(destsArray[i],body.hop,body.timeout);

			const data = {
				"source" : sourceInt,
				"destnation" : destsArray[i],
				"timestamp" : new BigNumber(microtime.now()).div(1000).round(0,1).toNumber(),
				"traceroute" : traceroute_result
			};

			// insert ping result to mongodb
			yield db.collection("traceroute").insertOne(data);
			console.log("data",data);
		}
		yield db.close();

		process.send("ok!");
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