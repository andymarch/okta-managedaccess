const express = require('express')
const router = express.Router()
const axios = require('axios')
var querystring = require("querystring");
var cache = require('memory-cache');
const uudiv1 = require('uuid/v1');

module.exports = function (){

//get the current entities an user can represent    
router.get("/", async function(req,res) {
    try{
        var query = querystring.stringify({search: 'profile.delegatedAgents eq "' + req.userContext + '"'})
        var resp = await axios.get(process.env.TENANT + 'api/v1/users/?'+query)
        res.json(resp.data)
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

//set the user as delegated to that entity and returns the id to include as
//state during a refresh
router.post("/", async function(req,res) {
    try{
        var entityQuery = await axios.get(process.env.TENANT+'api/v1/users/'+req.body.entityid)
        if(entityQuery.data.type.id != process.env.ENTITY_TYPE_ID){
            res.status(400).json({error: "Not an entity"})
        }
        else{
            entityQuery.data.profile.delegatedAgents.forEach(element => {
                if(element === req.userContext){
                    match = true
                }
            })             
            if(match){
                var cacheid = uudiv1()
                cache.put(cacheid,req.body.entityid,10000,function(key,value){
                    console.log("Session "+key+ " expired for "+value)
                })
                res.status(200).send({id:cacheid});
            }
            else{
                res.status(401).json({error: "User is not delegated by that entity."})
            }
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})
return router
}
