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
            //determine if this is a refresh
            var entityId = cache.get(req.body.data.context.protocol.request.state)

            if(entityId){
                var resp = await axios.get(process.env.TENANT+'api/v1/users/'+entityId)
                //check the user is still delegated by the entity
                var match = false;
                resp.data.profile.delegatedAgents.forEach(element => {
                    if(element === req.body.data.context.user.id){
                        match = true
                    }
                });              
                
                if(match){
                    var entityIdCommand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/entity_id',
                                'value': resp.data.profile.entityId
                            }
                        ]
                    }
                    structure[commands].push(entityIdCommand)

                    var entityNameCommand = {
                        'type': 'com.okta.identity.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/entity_name',
                                'value': resp.data.profile.entityName
                            }
                        ]
                    }
                    structure[commands].push(entityNameCommand)

                    var loaCommand = {
                        'type': 'com.okta.identity.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/LOA',
                                'value': resp.data.profile.LOA
                            }
                        ]
                    }
                    structure[commands].push(loaCommand)
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