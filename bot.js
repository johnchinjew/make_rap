require('dotenv').config()           // For accessing .env variables
const Twit     = require('twit')     // For interacting w/ Twitter API

// Setup Twitter stream auth w/ API keys from .env
const T = new Twit({
  consumer_key:        process.env.CONSUMER_KEY,
  consumer_secret:     process.env.CONSUMER_SECRET,
  access_token:        process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms:          60 * 1000, // Optional timeout for all HTTP requests
})

const TStream = T.stream('user')
