const express = require('express')
const router = express.Router()
const axios = require('axios')

module.exports = function (){

router.get("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.query.id)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){
            res.status(200).json({agents: resp.data.profile.delegatedAgents})
        }
        else {
            res.status(200).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

router.post("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.query.id)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){
            var agentQuery = await axios.get(process.env.TENANT+'api/v1/users/'+req.query.agentid)
            if(agentQuery.data.type.id == process.env.AGENCY_TYPE_ID){
                var agents = resp.data.profile.delegatedAgents
                agents.push(req.query.agentid)
                var payload = {
                    profile: {
                        delegatedAgents: agents
                    }
                }
                await axios.post(process.env.TENANT+'api/v1/users/'+req.query.id,payload)
                res.status(200).send();
            }
            else{
                res.status(200).json({error: "Not an agency"})
            }
        }
        else {
            res.status(200).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

router.delete("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.query.id)
        console.log(resp.data)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){
            var agentQuery = await axios.get(process.env.TENANT+'api/v1/users/'+req.query.agentid)
            if(agentQuery.data.type.id == process.env.AGENCY_TYPE_ID){
                var agents = resp.data.profile.delegatedAgents
                console.log(agents)
                var filtered = agents.filter(function(value, index, arr){
                    console.log(value + " "+ req.query.agentid)
                    console.log(JSON.stringify(value) !== req.query.agentid)
                    return value !== req.query.agentid;
                });

                console.log(filtered)

                var payload = {
                    profile: {
                        delegatedAgents: filtered
                    }
                }
                await axios.post(process.env.TENANT+'api/v1/users/'+req.query.id,payload)
                res.status(200).send();
            }
            else{
                res.status(200).json({error: "Not an agency"})
            }
        }
        else {
            res.status(200).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

return router
}
