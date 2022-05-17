var express = require('express');
const axios = require('axios').default;
require('dotenv').config();
var router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
var session ; 
var access_token ,refresh_token;
var access= require('./access');

//SSO Login page
router.get('/', function(req, res, next) {
    res.redirect(`https://gymkhana.iitb.ac.in/profiles/oauth/authorize/?client_id=${CLIENT_ID}&response_type=code&scope=basic profile picture`)
});

//Page to be redirected after login 
router.get("/redirect", function (req, res, next) {
    const auth_code = req.query.code;
    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: "code=" + auth_code + `&redirect_uri=http://localhost:3000/auth/redirect&grant_type=authorization_code`,
    }).then(function (response) {
        req.session.isAuth =true;
        access_token = response.data.access_token;
        refresh_token=response.data.refresh_token;
       
//Check if all permissions are granted; if not revoke the token 
    let permissions = response.data.scope.split(" ");
    console.log(permissions.length);
    if(permissions.length<3){

        console.log("Partial permissions given");
       
        axios({
            method: 'POST',
            url: "https://gymkhana.iitb.ac.in/profiles/oauth/revoke_token/",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            
            data: "token=" +refresh_token + `&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
        }).then(()=>{console.log("Your token is revoked");
    
    }).catch((error)=>{
            console.log(error.code);
            console.log("Revoking failed");
        })

        }
//all permissions are granted; set access_token and refresh_token for further use
  else{
    res.send(response.data);
  }
    }).
    catch(function (error) {
        console.log(error.code);
        console.log("Tokens not retrieved");
        
    });
 
});

//Get the profile pic and name of user 
router.get("/profile", function(req,res,next){ 
    access.getProfileInfo(res,access_token)});



//Checking if revoke is happening
router.get("/revoke",function(req,res,next){
    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/revoke_token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        
        data: "token=" +refresh_token + `&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    }).then(()=>{console.log("Revoked");
res.send("I revoked you boi");}).catch(()=>{console.log("HIehfihefe")})


})

function getNewAccessToken(){

    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data:  `refresh_token=${refresh_token}&grant_type=refresh_token`
    }).then(function (response) {
        req.session.isAuth =true;
        access_token = response.data.access_token;
        refresh_token=response.data.refresh_token;
      
    }).catch((error)=>{
        console.log(error.code)
    })


}

module.exports = {router,access_token};
