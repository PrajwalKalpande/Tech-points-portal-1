var db = require("./db.js");
var access = require('./access');
var express = require('express');
const axios = require('axios').default;
require('dotenv').config();


var dashboard_url = "/dashboard"
var router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
var cookie_options = { maxAge : 60*60*24*365 }

async function get_id(req) {
    var profile_db = await db.profile()
    var data = await profile_db.findOne({ access_token: req.cookies.access_token })
    if (data) return data["_id"];
    else return null; 
}
async function getpoints(req) {
    var transaction_db = await db.transaction();
    var transaction = await transaction_db.find({ access_token: req.cookies.access_token }).toArray();
    var sum = 0;
    transaction.forEach((data) => {
        sum += data["points"]
    })
    return sum;
}
async function update_access_token(access_token, data = false) {
    if (!data) {
        data = await access.get_profile_info(access_token);
    }
    data["_id"] = data["id"]
    delete data["id"];
    data["access_token"] = access_token;
    var profile = await db.profile()
    profile.updateOne({ _id: data["_id"] }, { $set: data }, { upsert: true })
    var transaction_db = await db.transaction()
    transaction_db.updateOne({ id : data["_id"] }, { $set: { access_token: access_token } }, { upsert: true })
}  //when new access token is fetched . It updates the profile database  
async function revoke_token(access_token) {
    return await axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/revoke_token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        data: "token=" + access_token + `&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
     }).then(() => {
        return true;
    }).catch((error) => {
        return false; 
    });
} // used to revoke the token when neccesary permission is not given by the user .
async function new_access_token(res,refresh_token) {
    return await axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: `refresh_token=${refresh_token}&grant_type=refresh_token`
    }).then(function (response) {
        res.cookie("access_token", response.data.access_token, cookie_options);
        res.cookie("refresh_token", response.data.refresh_token, cookie_options);
        return response.data.access_token ;
    }).catch((error) => {
        console.log(error.code)
        return false; 
    })
}


//SSO Login page
router.all('/', async function (req, res, next) {
    if (req.cookies.access_token) {
        var profile = await access.get_profile_info(req.cookies.access_token);
        if (profile) { //valid access_token
            update_access_token(req.cookies.access_token);
            res.redirect(dashboard_url)
            return;
        }
    }
    if (req.cookies.refresh_token) {
        var access_token = await new_access_token(res, req.cookies.refresh_token)
        if (access_token) {
            update_access_token(access_token)
            res.redirect(dashboard_url)
            return; 
        }
    }
    res.redirect(`https://gymkhana.iitb.ac.in/profiles/oauth/authorize/?client_id=${CLIENT_ID}&response_type=code&scope=basic profile picture`);
});
//Page to be redirected after login 
router.get("/redirect",  function (req, res, next) {
    const auth_code = req.query.code;
    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: "code=" + auth_code + `&redirect_uri=http://localhost:3000/redirect&grant_type=authorization_code`,
    }).then(async function (response) {  
        var access_token = response.data.access_token;
        var refresh_token = response.data.refresh_token;   
        let permissions = response.data.scope.split(" ");//Check if all permissions are granted; if not revoke the token 
        if (permissions.length < 3) {
            if (await revoke_token(access_token)) {
                var access_token = req.cookies.access_token;
                res.clearCookie("access_token"); 
                res.clearCookie("refresh_token");
                res.send("Only Partial permissions given , So Access is Revoked Successfully ")
            } else {
                res.send("Revoke Failed ,  Please login again");
            }
        }
        else {  //all permissions are granted; set access_token and refresh_token for further use  
            res.cookie("access_token", access_token, cookie_options)
            res.cookie("refresh_token", refresh_token, cookie_options)
            update_access_token(access_token);
            res.redirect(dashboard_url) 
        }
    }).catch(function (error) {
        console.log(error)
        res.status(400).send("Login Failed") 
    });
});
//Get the profile pic and name of user 
router.get("/profile", async function (req, res, next) {
    var access_token = req.cookies.access_token;
    var profile = await access.get_profile_info(access_token);
    if (profile) { res.send(profile) }
    else { res.status(400).send( "Profile Not Found" ) }
})
router.get("/transaction", async function get_points(req, res, next) {
    var transaction_db = await db.transaction();
    var transaction = await transaction_db.find({ access_token: req.cookies.access_token }).toArray();
    if (transaction) {
        res.send(transaction)
    }
    else {
        res.status(404).send()
    }
});
router.post("/redeem", async function create_transaction(req, res, next) {
    var id = await get_id(req)
    var transaction_db = await db.transaction();
    var available_points = await getpoints(req);
    var points = req.body.points;
    var pid = req.body.pid;
    // should add the condition to get the points from pid  and check its availability . 

    if (available_points >= points) {
        transaction_db.insertOne({ id: id, date: (new Date()).getTime(), access_token: req.cookies.access_token, event: "redeem", points: - points, "pid": pid })
        res.send("success")
    }
    else {
        res.send("no enough points")
    }
});

module.exports = {router};
