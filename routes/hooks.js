const express = require('express')
const router = express.Router()
const axios = require('axios')

module.exports = function (){
    router.post("/agent", async function(req,res) {
        try{
            var structure = {}
            var commands = 'commands'
            structure[commands] = []

            var agent =  await axios.get(
                process.env.TENANT+'api/v1/users/'
                +req.body.data.context.session.userId)

            var parentAgency = await axios.get(
                process.env.TENANT+'api/v1/users/'
                +req.body.data.context.session.userId + 
                "/linkedObjects/parentAgency")

            if(parentAgency.data.length > 0){
                var response = await axios.get(parentAgency.data[0]._links.self.href);
                console.log(response.data)
                var agencyIdCommand = {
                    'type': 'com.okta.access.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/agency',
                            'value': response.data.profile.agencyid
                        }
                    ]
                }
                structure[commands].push(agencyIdCommand)

                var agencyNameCommand = {
                    'type': 'com.okta.identity.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/agency',
                            'value': response.data.profile.agencyName
                        }
                    ]
                }
                structure[commands].push(agencyNameCommand)

                var resp = await axios.get(
                    process.env.TENANT + 'api/v1/users/?search='
                    + encodeURIComponent
                    ('profile.entityId eq "' + agent.data.profile.actingOnBehalfOf +'"' ))

                if(resp.data.length == 1) {

                    var match = false;
                    resp.data.profile.delegatedAgents.array.forEach(element => {
                        console.log(element)
                        if(element === response.data.profile.agencyid){
                            match = true
                        }
                    });              
                    
                    if(match){
                    var entityIdCommand = {
                        'type': 'com.okta.access.patch',
                        'value': [
                            {
                                'op': 'add',
                                'path': '/claims/entity',
                                'value': resp.data[0].profile.entityId
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
                                'value': resp.data[0].profile.entityName
                            }
                        ]
                    }
                    structure[commands].push(entityNameCommand)
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