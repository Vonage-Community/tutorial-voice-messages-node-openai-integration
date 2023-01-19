'use strict'

require("dotenv").config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http')
const unirest = require('unirest')

const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const openaiApiKey = process.env.OPENAI_API_KEY;
const eventUrl = process.env.EVENT_URL

app.use(bodyParser.json())

//const privateKey = require('fs').readFileSync('private.key');

app.get('/webhooks/answer', (request, response) => {

  const ncco = [{
      action: 'talk',
      text: 'Hi, describe an image that you want to generate'
    },
    {
      eventMethod: 'POST',
      action: 'input',
      eventUrl: [
        eventUrl],
      type: [ "speech" ],
      speech: {
        language: 'en-gb',
        endOnSilence: 0.5
      }
    },
    {
      action: 'talk',
      text: 'Thank you'
    }
  ]
  console.log('/webhooks/answer')
  response.json(ncco)
  
})

app.post('/webhooks/asr', (request, response) => {

    console.log(request.body)
    console.log(request.body.speech.results[0].text)
    console.log(request.body.from)
    let phoneNumber = request.body.from
    console.log(request.body.timestamp)
    let promptText = request.body.speech.results[0].text
    
    var req = unirest('POST', 'https://api.openai.com/v1/images/generations')
    .headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + openaiApiKey
    })
    .send(JSON.stringify({
      "prompt": promptText,
      "n": 1,
      "size": "1024x1024"
    }))
    .end(function (res) { 
      if (res.error) throw new Error(res.error); 
      console.log(res.raw_body);
      console.log(res.body.data[0].url)
      let imgUrl = res.body.data[0].url
      sentMsg(phoneNumber, imgUrl)

    });

    const ncco = [{
      action: 'talk',
      text: `Got it, I'll sent link to generated image in WhatsApp`
    }]
    response.json(ncco)
    
  })

function sentMsg(phoneNumber, imgUrl) { 
  console.log('sentMsg');
    console.log(phoneNumber, imgUrl);

    var req = unirest('POST', 'https://messages-sandbox.nexmo.com/v1/messages')
  .headers({
    'Authorization': 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64'),
    'Content-Type': 'application/json'
  })
  .send(JSON.stringify({
    "from": "14157386102",
    "to": phoneNumber,
    "message_type": "text",
    "text": imgUrl,
    "channel": "whatsapp"
  }))
  .end(function (res) { 
    if (res.error) throw new Error(res.error); 
    console.log(res.raw_body);
  });
}


app.post('/webhooks/events', (request, response) => {
    
    console.log('/webhooks/events')
    console.log(request.body)
    response.sendStatus(200);  
  })

const port = 3000
app.listen(port, () => console.log(`Listening on port ${port}`))