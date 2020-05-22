const express = require('express')
const router = express.Router()
const axios = require('axios')
const AgentModel = require('../models/agentmodel')

module.exports = function (){

//List the agents of the user
router.get("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){
            var agents = []
            for(var entry in resp.data.profile.delegatedAgents){
                var agent = await axios.get(process.env.TENANT + 'api/v1/users/'+resp.data.profile.delegatedAgents[entry])
                agents.push(new AgentModel(agent.data))
                }
            res.status(200).json({agents: agents})
        }
        else {
            res.status(400).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

//Add a user to the list of delegated agents
router.post("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){ 
            var agentid;
            try{
                //agentid could be either the id of the user or their login
                //a user login can contain nonURL safe characters so encode that
                var resp = await axios.get(process.env.TENANT+'api/v1/users/'+encodeURI(req.userContext))
                agentid = resp.data.id
            } catch (error){
                //could not find that user
                res.status(404).send("user " + req.body.agentid + " not found")
                return
            }

            var agents = resp.data.profile.delegatedAgents
            if (agents == null){
                agents = []
            }
            agents.push(agentid)
            var payload = {
                profile: {
                    delegatedAgents: agents
                }
            }
            await axios.post(process.env.TENANT+'api/v1/users/'+req.userContext,payload)
            res.status(200).send();
        }
        else {
            res.status(400).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

router.delete("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.ENTITY_TYPE_ID){
            var agents = resp.data.profile.delegatedAgents
            var filtered = agents.filter(function(value, index, arr){
                return value !== req.body.agentid;
            });

            var payload = {
                profile: {
                    delegatedAgents: filtered
                }
            }
            await axios.post(process.env.TENANT+'api/v1/users/'+req.userContext,payload)
            res.status(200).send();
        }
        else {
            res.status(400).json({error: "Not an entity"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

return router
}
