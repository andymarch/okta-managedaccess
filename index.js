require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')

app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

axios.defaults.headers.common['Authorization'] = `SSWS `+process.env.TOKEN

var preAuthRouter = require('./routes/entity')()
var hooksRouter = require('./routes/hooks')()
app.use('/entity', preAuthRouter)
app.use('/tokenEnrichment', hooksRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('app started on '+PORT))