const express = require('express')
const router = express.Router()
const axios = require('axios')
var cache = require('memory-cache');

module.exports = function (){
    router.post("/agent", async function(req,res) {
        try{
            var structure = {}
            var commands = 'commands'
            structure[commands] = []
            
            console.log(req.body.data.context)
            //determine if this is a refresh
            console.log("Looking up "+req.body.data.context.protocol.request.state)
            var entityId = cache.get(req.body.data.context.protocol.request.state)

            if(entityId){
                console.log("found cache hit")
                var resp = await axios.get(process.env.TENANT+'api/v1/users/'+entityId)
                //check the user is still delegated by the entity
                var match = false;
                console.log("Agents: "+resp.data.profile.delegatedAgents)
                resp.data.profile.delegatedAgents.forEach(element => {
                    if(element === req.body.data.context.user.id){
                        match = true
                    }
                });              
                
                if(match){
                    console.log("found match")
                    var entityIdCommand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/entityId',
                                'value': resp.data.profile.entityId
                            }
                        ]
                    }
                    structure[commands].push(entityIdCommand)
                    console.log("patched id")

                    var entityNameCommand = {
                        'type': 'com.okta.identity.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/entityName',
                                'value': resp.data.profile.entityName
                            }
                        ]
                    }
                    structure[commands].push(entityNameCommand)
                    console.log("patch access")
                }
            }
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })

    router.post("/entity", async function(req,res) {
        try{
            var structure = {}
            var commands = 'commands'
            structure[commands] = []

            var parentEntity = await axios.get(
                process.env.TENANT+'api/v1/users/'
                +req.body.data.context.session.userId + 
                "/linkedObjects/parentEntity")

            if(parentEntity.data.length > 0){
                var response = await axios.get(parentEntity.data[0]._links.self.href);
                var entityIdCommand = {
                    'type': 'com.okta.access.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/entity',
                            'value': response.data.profile.entityId
                        }
                    ]
                }
                structure[commands].push(entityIdCommand)

                var entityNameCommand = {
                    'type': 'com.okta.identity.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/entity',
                            'value': response.data.profile.entityName
                        }
                    ]
                }
                structure[commands].push(entityNameCommand)
            }
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })


return router
}