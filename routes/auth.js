var express = require('express');
const axios = require('axios').default;
require('dotenv').config();
var router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
var access= require('./access');


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
}

async function getNewAccessToken(req,refresh_token) {
    return await axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: `refresh_token=${refresh_token}&grant_type=refresh_token`
    }).then(function (response) {
        req.session.access_token = response.data.access_token;
        req.session.refresh_token = response.data.refresh_token;
        return true ; 
    }).catch((error) => {
        console.log(error.code)
        return false; 
    })
}



//SSO Login page
router.get('/delete', (req, res, next) => {
    delete req.session.access_token;
    res.send("Deleted Access Token")
})



router.get('/', async function (req, res, next) {
    if (req.session.access_token) {
        var profile = await access.getProfileInfo(req.session.access_token);
        if (profile) {//valid access_token
            res.send("Access token valid : ", req.session.access_token)            
            return; 
        }
    }
    if (req.session.refresh_token) {
        if (await getNewAccessToken(req, req.session.refresh_token)) {
            res.send("Revoke token used . New Access Token : ",req.session.access_token);
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
        data: "code=" + auth_code + `&redirect_uri=http://localhost:3000/auth/redirect&grant_type=authorization_code`,
    }).then(async function (response) {  
        var access_token = response.data.access_token;
        var refresh_token=response.data.refresh_token;   
        let permissions = response.data.scope.split(" ");//Check if all permissions are granted; if not revoke the token 
        if (permissions.length < 3) {
            if (await revoke_token(access_token)) {
                var access_token = req.session.access_token;
                delete req.session.access_token, req.session.refresh_token; 
                res.send("Only Partial permissions given , So Access is Revoked Successfully ")
            } else {
                res.send("Revoke Failed ,  Please login again");
            }
        }
        else {  //all permissions are granted; set access_token and refresh_token for further use
               req.session.access_token = access_token;
               req.session.refresh_token = refresh_token;
               req.session.save(); //explicitly calling save session 
               res.send(response.data);
        }
    }).catch(function (error) {
        console.log(error)
        res.status(400).send("Login Failed") 
    });
 
});


//Get the profile pic and name of user 
router.get("/profile", async function (req, res, next) {
    var access_token = req.session.access_token;
    var profile = await access.getProfileInfo(access_token);
    if (profile) { res.send(profile) }
    else { res.status(400).send( "Profile Not Found" ) }
})



module.exports = {router};
