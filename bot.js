require('dotenv').config()           // For accessing .env variables
const Twit     = require('twit')     // For interacting w/ Twitter API
const Datamuse = require('datamuse') // For fetching rhymes
const SwearJar = require('swearjar') // Profanity checking


// Setup!
// ------

// Consts for Twitter bot/rap generation
const SCREEN_NAME  = 'make_rap' // Twitter username w/o '@'
const CHAR_LIMIT   = 140        // 140 chars per tweet max
const NUM_LINES    = 4  // Lines per rap
const NUM_RHYMES   = 48 // Num rhymes to fetch (must be >= num blanks in a rap)
const MAX_ATTEMPTS = 32 // Max times to retry making a rap from a tweet

// Setup Twitter stream auth w/ API keys from .env
const T = new Twit({
  consumer_key:        process.env.CONSUMER_KEY,
  consumer_secret:     process.env.CONSUMER_SECRET,
  access_token:        process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms:          60 * 1000, // Optional timeout for all HTTP requests
})

const TStream = T.stream('user')


// Listen for tweets...
// --------------------

TStream.on('tweet', t => {
  const senderName   = t.user.screen_name
  const receiverName = t.in_reply_to_screen_name
  const receivedId   = t.id_str
  const text         = t.text // Twitter trims whitespace from front
  const lang         = t.lang

  // Ignore tweets not aimed at the bot
  if (receiverName !== SCREEN_NAME)
    return

  // Ignore tweets from the bot itself
  if (senderName === receiverName) {
    console.log('Tweet ignored: Sent from the bot itself.')
    return
  }

  // Ignore tweets with profanity
  if (SwearJar.profane(text)) {
    console.log('Tweet ignored: Contains profanity.')
    return
  }

  // Try to ignore non-English tweets
  if (lang !== 'en' && lang !== 'und') {
    console.log('Tweet ignored: Non-English language.')
    return
  }

  // Remove '@make_rap' from front of text
  const textBody = text.slice(SCREEN_NAME.length + 1)

  // Ignore tweets w/o text beyond the '@make_rap'
  if (!textBody) {
    console.log('Tweet ignored: Not enough valid text.')
    return
  }

  // Extract last word from text body
  const lastWord = (textBody.match(/\w+/g) || []).pop()

  // Ignore tweets w/o a detectable last word
  if (!lastWord) {
    console.log('Tweet ignored: Not enough valid text.')
    return
  }

  // Ellipsize first line of rap if too long
  const firstLine = ellipsizeMiddle(textBody, 32, '…')

  // Fetch rhymes...

  // Generate rap...

  // Tweet rap...

})


// Terminal says hello :)
// ----------------------

console.log('  _ \\                _ )        |   \n    \/   _` |  _ \\    _ \\   _ \\   _| \n _|_\\ \\__,_| .__\/   ___\/ \\___\/ \\__| \n            _|')
console.log('(Made w/ <3 by @johnchinjew)')
console.log('RUNNING...')


// Helper functions, thanks little guys!
// -------------------------------------

function ellipsizeMiddle(str, numCharsKept) {
  const l = str.length
  const i = numCharsKept * .5
  if (l <= numCharsKept)
    return str
  return rtrim(str.slice(0, Math.ceil(i)))
    + '…' + ltrim(str.slice(l - Math.floor(i), l))
}

function ltrim(str) {return str.replace(/^\s+/, '')}
function rtrim(str) {return str.replace(/\s+$/, '')}
