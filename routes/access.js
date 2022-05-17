var express = require('express');
const axios = require('axios').default;
require('dotenv').config();
 
//Function to retrieve user info
const getProfileInfo =( res, access_token)=>{
    axios( {method: 'GET',
    url: "https://gymkhana.iitb.ac.in/profiles/user/api/user/?fields=first_name,last_name,profile_picture",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Authorization":  "Bearer "+ access_token,
    }
     
    }).then((response)=>{res.send(response.data)})
    .catch(function (error) {
        console.log(error.code);
        console.log("Error retrieving user profile data");
});
}

module.exports = {getProfileInfo};