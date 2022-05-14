var express = require('express');
const axios = require('axios').default;
var router = express.Router();
var CLIENT_ID = "wvyxYDXQMzJJsT3ByHfgJ52H6sDwPAtHiLjmDCRk";
var CLIENT_SECRET = "aZe5ObLPi29qTVF1Ip5QnAJLViKfjL3ZCFls2iwWnDEudycCLRASYnfpO28kx987yYynoWZXGCOPbJ0My4eig4saBZ6fYat0wlzh1K7odgSuNspSz4dMA0sIF7ju7FDb"

router.get('/', function(req, res, next) {
    res.redirect(`https://gymkhana.iitb.ac.in/profiles/oauth/authorize/?client_id=${CLIENT_ID}&response_type=code`)
});

router.get("/redirect", function (req, res, next) {
    var auth_code = req.query.code;
    axios({
        method: 'POST',
        url: "https://gymkhana.iitb.ac.in/profiles/oauth/token/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        auth: { "username": CLIENT_ID, "password": CLIENT_SECRET },
        data: "code=" + auth_code + "&redirect_uri=http://localhost:3000/auth/redirect&grant_type=authorization_code",
    }).then(function (response) {
        res.send(response.data);
    }).catch(function (error) {
        console.log(error)
    });


})



module.exports = router;
