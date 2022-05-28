var express = require('express');
const axios = require('axios').default;
require('dotenv').config();
 
//Function to retrieve user info
const getProfileInfo = async (access_token) => {
    try {
        const { data: response } = await axios({
            method: 'GET',
            url: "https://gymkhana.iitb.ac.in/profiles/user/api/user/?fields=first_name,last_name,profile_picture",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Authorization": "Bearer " + access_token,
            }
        })
        return response; 
    }
    catch (error) {
       console.log(error)
    }
}
module.exports = {getProfileInfo};