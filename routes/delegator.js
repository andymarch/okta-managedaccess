const express = require('express')
const router = express.Router()
const axios = require('axios')
const AgentModel = require('../models/agentmodel')

module.exports = function (){

router.post("/delegation", async function (req,res){
    if(req.body.op == null){
        res.status(400)
        return
    }

    var operation = req.body.op.toUpperCase()
    if(operation == "ACTIVATE" || operation == "DEACTIVATE"){        
        var type = (operation == "ACTIVATE") ? process.env.DELEGATED_USER_TYPE_ID : process.env.USER_TYPE_ID
        
        try{
            var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
            var profile = resp.data.profile
            if(operation == "ACTIVATE"){
                //this is a work around for authorization server can_delegate
                //claim in the authz server
                profile.delegatedAgents = []
            } else {
                //remove attributes not present on parent object type
                delete profile.delegatedAgents
            }

            var payload = {
                id: resp.data.id,
                profile: profile,
                credentials: resp.data.credentials,
                type: {
                    id: type
                }
            }
            await axios.put(process.env.TENANT+'api/v1/users/'+req.userContext,payload)
            res.status(200).send()
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    }
    else{
        res.status(400).send("Invalid operation")
    }
})

//List the agents of the user
router.get("/agents", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.DELEGATED_USER_TYPE_ID){
            var agents = []
            for(var entry in resp.data.profile.delegatedAgents){
                var agent = await axios.get(process.env.TENANT + 'api/v1/users/'+resp.data.profile.delegatedAgents[entry])
                agents.push(new AgentModel(agent.data))
                }
            res.status(200).json({agents: agents})
        }
        else {
            res.status(400).json({error: "Not an delegatable user type"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

//Add a user to the list of delegated agents
router.post("/agents/add", async function(req,res) {
    try{
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.DELEGATED_USER_TYPE_ID){ 
            var agentid;
            try{
                //agentid could be either the id of the user or their login
                //a user login can contain nonURL safe characters so encode that
                var agentResp = await axios.get(process.env.TENANT+'api/v1/users/'+encodeURI(req.body.agentid))
                agentid = agentResp.data.id
            } catch (error){
                //could not find that user
                res.status(404).send("user " + req.body.agentid + " not found")
                return
            }

            var agents = resp.data.profile.delegatedAgents
            console.log(agents)
            if (agents == undefined){
                console.log("creating new agents array")
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
            res.status(400).json({error: "Not an delegatable user type"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

router.post("/agents/remove", async function(req,res) {
    try{
        console.log(req)
        console.log("request to remove "+req.body.agentid)
        var resp = await axios.get(process.env.TENANT+'api/v1/users/'+req.userContext)
        if(resp.data.type.id == process.env.DELEGATED_USER_TYPE_ID){
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
            res.status(400).json({error: "Not an delegatable user type"})
        }
    } catch(error){
        console.log(error)
        res.status(500).send("An error occurred")
    }
})

return router
}
