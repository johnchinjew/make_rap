const Twit     = require('twit')
const Datamuse = require('datamuse')
const SwearJar = require('swearjar')
const config   = require('./config')

const T = new Twit(config.bot.keys)
const stream = T.stream('user')

// Listen for tweets
stream.on('tweet', t => {
  const senderName   = t.user.screen_name
  const receiverName = t.in_reply_to_screen_name
  const receivedId   = t.id_str
  const lang         = t.lang
  const textRaw      = t.text // Keeps the '@make_rap' prepended to the front of the tweet
  const textBody     = textRaw.trim().slice(config.bot.screen_name.length+1) // '@make_rap' removed
  const textLastWord = (textBody.match(/\w+/g) || []).pop()
  const textShort    = ellipsizeMiddle(textBody, 32, '…')
  const fetchMax     = Math.floor(config.rap.num_rhymes*.5) // Max rhymes for each request

  // Ignore conditions
  if (receiverName !== config.bot.screen_name) return
  if (senderName === config.bot.screen_name)   {console.log('Ignored: Sent from the bot itself.'); return}
  if (SwearJar.profane(textRaw))       {console.log('Ignored: Contains profanity.');    return}
  if (lang !== 'en' && lang !== 'und') {console.log('Ignored: Non-English language.');  return}
  if (!textBody || !textLastWord)      {console.log('Ignored: Not enough valid text.'); return}

  // Fetch rhymes
  Promise.all([
    Datamuse.words({rel_rhy: textLastWord, max: fetchMax}),
    Datamuse.words({rel_nry: textLastWord, max: fetchMax})
  ]).then(resps => {
    let rhymes = [].concat(...resps).map(w => w.word)

    // Generate rap
    let rap = makeRap(textShort, rhymes, config.rap.num_lines)
    let tries = 0
    if (!rap) return
    while (rap.length > config.bot.char_limit && tries < config.rap.max_retries) {
      rap = makeRap(textShort, rhymes, config.rap.num_lines)
      tries++
    }
    if (tries === config.bot.char_limit)
      console.log('Fail: Could not satisfy character limit.')

    // Tweet rap (w/ 'dispersion throttling')
    disperse(() => tweetInReply(senderName, receivedId, rap))

  }, err => {
    console.log('Fail: Could not fetch rhymes.')
    console.log(err)
  })
})

// Terminal says hello :)
console.log('  _ \\                _ )        |   \n    \/   _` |  _ \\    _ \\   _ \\   _| \n _|_\\ \\__,_| .__\/   ___\/ \\___\/ \\__| \n            _|')
console.log('(Made w/ <3 by @johnchinjew)')
console.log('RUNNING...')


// Helper functions, thanks guys!
// Ellipsize strings from the middle
function ellipsizeMiddle(str, numCharsKept) {
  const l = str.length
  const i = numCharsKept*.5
  if (l <= numCharsKept)
    return str
  return rtrim(str.slice(0, Math.ceil(i)))
    +'…'+ltrim(str.slice(l - Math.floor(i), l))
}

function ltrim(str) {return str.replace(/^\s+/, '')}
function rtrim(str) {return str.replace(/\s+$/, '')}

// Returns a randomly shuffled array
function shuffled(a) {
  let i = a.length, j
  while (i > 0) {
    j = (Math.random() * i--) | 0
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

// Disperses function invocation randomly over time range
function disperse(fn, soonest=5000, latest=soonest+15000) {
  if (soonest < 0 || latest < soonest)
    return false
  const t = setTimeout(fn, soonest + Math.floor(Math.random() * (latest-soonest+1)))
  return {
    cancel: () => clearTimeout(t)
  }
}

function makeRap(firstLine, validRhymes, numLines) {
  let lines  = shuffled(config.rap.templates.slice())
  let rhymes = shuffled(validRhymes.slice())
  let rap = firstLine
  for (let i = 0; i < numLines-1; i++)
    rap += '\n' + lines.pop()
  if (rhymes.length < rap.match(/_/g).length) {
    console.log('Error: Can\'t make rap, not enough rhymes.')
    return undefined
  }
  if (lines.length < numLines) {
    console.log('Error: Can\'t make rap, not enough templates.')
    return undefined
  }
  return rap.split('').map(c => (c === '_') ? rhymes.pop() : c).join('')
}

function tweetInReply(receiver, id, body) {
  const payload = {
    in_reply_to_status_id: id,
    status: '@' + receiver + ' ' + body
  }
  T.post('statuses/update', payload, tweetPosted)
}

function tweetPosted(err, data, resp) {
  if (err) {
    console.log('ERROR: Issue posting tweet.')
    console.log(err)
    return
  }
  const receiver = data.in_reply_to_screen_name
  const when     = data.created_at
  console.log('Success: Rap sent to @' + receiver, '(' + when + ')')
}
