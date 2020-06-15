require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const OktaJwtVerifier = require("@okta/jwt-verifier")

app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

axios.defaults.headers.common['Authorization'] = `SSWS `+process.env.TOKEN

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.ISSUER,
});

function verifyUserAccess(req,res,next){
  var authz = req.header("Authorization")
  if(authz != null && authz.startsWith("Bearer")){
    oktaJwtVerifier.verifyAccessToken(authz.replace("Bearer ",""),process.env.TOKEN_AUD)
    .then(jwt => {
        req.userContext = jwt.claims.uid
        return next();
    })
    .catch(err => {
      console.log(err)
      res.status(401).send({message: 'Access denied.'})
    });   
  }
  else{
    console.log("Unauthenticated request")
      res.status(401).send({message: 'Access denied.'})
  }
}

function verifyServiceAccess(req,res,next){
  var authz = req.header("Authorization")
  if(authz != null){
      if(authz == process.env.SERVICE_AUTH_SECRET){
      return next();
    }
    else {
      console.log("Service authentication failed.")
      res.status(401).send({message: 'Access denied.'})
    }
  }
  else{
    console.log("Unauthenticated request")
      res.status(401).send({message: 'Access denied.'})
  }
}

var agentRouter = require('./routes/agent')()
var delegatorRouter = require('./routes/delegator')()
var hooksRouter = require('./routes/hooks')()
app.use('/delegator', verifyUserAccess, delegatorRouter)
app.use('/agent', verifyUserAccess, agentRouter)
app.use('/tokenEnrichment', verifyServiceAccess, hooksRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Managed Access started on '+PORT))