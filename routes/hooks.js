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

            console.log(agent.data)

            var parentAgency = await axios.get(
                process.env.TENANT+'api/v1/users/'
                +req.body.data.context.session.userId + 
                "/linkedObjects/parentAgency")

            console.log(parentAgency.data)

            if(parentAgency.data.length > 0){
                var response = await axios.get(parentAgency.data[0]._links.self.href);
                console.log(response.data)
                var agencyIdCommand = {
                    'type': 'com.okta.access.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/agencyId',
                            'value': response.data.profile.entityId
                        }
                    ]
                }
                structure[commands].push(agencyIdCommand)

                var resp = await axios.get(
                    process.env.TENANT + 'api/v1/users/?search='
                    +encodeURIComponent
                    ('profile.entityId eq "' + agent.data.profile.actingOnBehalfOf +'"' ))
                console.log(resp.data)
                res.send()
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
                            'path': '/claims/entityid',
                            'value': response.data.profile.entityId
                        }
                    ]
                }
                structure[commands].push(entityIdCommand)
            }
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })


return router
}