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

            //using the state provided by the client to the authorization server
            //identify if we have a matching exercise request
            var entityId = cache.get(req.body.data.context.protocol.request.state)

            if(entityId){
                //invalidate excerise request for that key
                cache.del(req.body.data.context.protocol.request.state)

                var resp = await axios.get(process.env.TENANT+'api/v1/users/'+entityId)
                //check the user calling authorize is delegated by the entity
                var match = false;
                resp.data.profile.delegatedAgents.forEach(element => {
                    if(element === req.body.data.context.user.id){
                        match = true
                    }
                });              
                
                if(match){
                    //always patch in the on_behalf claim
                    var onBehalfCommand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/on_behalf',
                                'value': 'True'
                            }
                        ]
                    }
                    structure[commands].push(onBehalfCommand)

                    //ensure that the delegated user does not have the can_delegate
                    //claim. Only the true sub can add delegates but this will
                    //hide any function that is only available to the true sub.
                    var canDelegateCommand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'replace',
                                'path': '/claims/can_delegate',
                                'value': 'False'
                            }
                        ]
                    }
                    structure[commands].push(canDelegateCommand)

                    //note this assumes the sub is the users login
                    //login is common but can be overriden with client mappings
                    //switch case by the client id in context.protocol.client.id
                    var onBehalfSubCommmand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/on_behalf_sub',
                                'value': resp.data.profile.login
                            }
                        ]
                    }
                    structure[commands].push(onBehalfSubCommmand)

                    //TODO these should only patch if the claim exists already
                    //this would fix conditions where a claim is included in a
                    //scope condition

                    //patch any access token claims
                    if(process.env.DELEGATED_ACCESS_CLAIMS){
                        process.env.DELEGATED_ACCESS_CLAIMS.split(' ').forEach(element => {
                            if(resp.data.profile.hasOwnProperty(element)){
                                var accessCommand = {
                                    'type': 'com.okta.access.patch',
                                    'value': [
                                        {
                                            'op': 'replace',
                                            'path': '/claims/'+element,
                                            'value': resp.data.profile[element]
                                        }
                                    ]
                                }
                                structure[commands].push(accessCommand)
                            }
                        });
                    }

                    //patch any requested identity token claims
                    if(process.env.DELEGATED_IDENTITY_CLAIMS){
                        process.env.DELEGATED_IDENTITY_CLAIMS.split(' ').forEach(element => {
                            if(resp.data.profile.hasOwnProperty(element)){
                                var identityCommand = {
                                    'type': 'com.okta.identity.patch',
                                    'value': [
                                        {
                                            'op': 'replace',
                                            'path': '/claims/'+element,
                                            'value': resp.data.profile[element]
                                        }
                                    ]
                                }
                                structure[commands].push(identityCommand)
                            }
                        });
                    }
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