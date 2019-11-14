const express = require('express')
const router = express.Router()
const axios = require('axios')

module.exports = function (){
    router.post("/agent", async function(req,res) {
        let responsePayload = {}
        try{
            console.log(req.body.data)
            console.log(req.body.data.context.user.profile)
            var structure = {}
            var commands = 'commands'
            structure[commands] = []
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })

    router.post("/entity", async function(req,res) {
        let responsePayload = {}
        try{
            var structure = {}
            var commands = 'commands'
            structure[commands] = []

            var parentEntity = await axios.get(process.env.TENANT+'api/v1/users/'+req.body.data.context.session.userId + 
            "/linkedObjects/parentEntity")
            if(parentEntity.data.length > 0){
                var response = await axios.get(ownerObj_response.data[0]._links.self.href);
                var accessCommand = {
                    'type': 'com.okta.access.patch',
                    'value': [
                        {
                            'op': 'add',
                            'path': '/claims/entityid',
                            'value': response.data.profile.entityId
                        }
                    ]
                }
            }
            structure[commands].push(accessCommand)
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })


return router
}