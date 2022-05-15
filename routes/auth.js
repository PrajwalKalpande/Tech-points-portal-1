var express = require('express');
const axios = require('axios').default;
var router = express.Router();
var CLIENT_ID = "wvyxYDXQMzJJsT3ByHfgJ52H6sDwPAtHiLjmDCRk";
var CLIENT_SECRET = "aZe5ObLPi29qTVF1Ip5QnAJLViKfjL3ZCFls2iwWnDEudycCLRASYnfpO28kx987yYynoWZXGCOPbJ0My4eig4saBZ6fYat0wlzh1K7odgSuNspSz4dMA0sIF7ju7FDb"

router.get('/', function (req, res, next) {
    var params = {
        "client_id": CLIENT_ID,
        "response_type":"code" ,
         "scope": "basic ldap profile picture",
    }
    var query = new URLSearchParams(params).toString();
    res.redirect(`https://gymkhana.iitb.ac.in/profiles/oauth/authorize/?` + query  )
});



router.get("/redirect", function (req, res, next) {
    var auth_code = req.query.code;
    var params = {"code": auth_code,
        "redirect_uri": "http://localhost:3000/auth/redirect",
        "grant_type": "authorization_code"
    }
    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: new URLSearchParams(params).toString() 
    }).then(async function (response) {
        var access_token = response.data.access_token;
        var user_data = await get_user_data(access_token); // function that user data given access token 
        res.send(user_data);
    }).catch(function (error) {
        console.log(error)
    });
})




module.exports = router;
