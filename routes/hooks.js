const express = require('express')
const router = express.Router()
const axios = require('axios')

module.exports = function (){
    router.post("/agent", async function(req,res) {
        let responsePayload = {}
        try{
            console.log(req.body.data)
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
            console.log(req.body.data)
            var structure = {}
            var commands = 'commands'
            structure[commands] = []
            res.status(200).json(structure)
        } catch(error){
            console.log(error)
            res.status(500).send("An error occurred")
        }
    })


return router
}