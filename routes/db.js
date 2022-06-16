var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
let db ; 
MongoClient.connect(url, function (err, dbo) {
        if (err) throw err;
    db = dbo.db("techpoints");
});

let profile =  ()  => db.collection("profile") 
let transaction =  ()  => db.collection("transaction") 

module.exports = { profile, transaction };
