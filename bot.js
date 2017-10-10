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
  const when         = t.created_at
  const lang         = t.lang
  const textRaw      = t.text // Keeps the '@make_rap' prefix
  const textBody     = ltrim(textRaw.slice(config.bot.screen_name.length+1)) // Removes the '@make_rap' prefix
  const textLastWord = (textBody.match(/\w+/g) || []).pop()
  const textShort    = ellipFront(rtrim(textBody), 18)
  const fetchMax     = Math.floor(config.rap.num_rhymes*.5) // Max rhymes for each request

  if (receiverName !== config.bot.screen_name)
    return // Log nothing, triggered too often

  if (senderName === config.bot.screen_name) {
    console.log('Ignored: Sent from the bot itself.'); return}

  if (SwearJar.profane(textRaw)) {
    console.log('Ignored: Contains profanity.'); return}

  if (lang !== 'en' && lang !== 'und') {
    console.log('Ignored: Non-English language.'); return}

  if (!textBody || !textLastWord) {
    console.log('Ignored: Not enough valid text.'); return}

  // Recieved valid tweet!
  console.log('Note: Tweet recieved from @' + senderName + ' (' + when + ')')

  // Fetch rhymes
  Promise.all([
    Datamuse.words({rel_rhy: textLastWord, max: fetchMax}),
    Datamuse.words({rel_nry: textLastWord, max: fetchMax})
  ]).then(resps => {
    let rhymes = [].concat(...resps).map(w => w.word)

    // Generate rap
    let r = compileRap(textShort, rhymes, config.rap.num_lines)
    if (!r) return
    let tries = 0
    let length = r.length
    let limit = config.bot.char_limit - senderName.length - 2

    while (length > limit && tries < config.rap.max_retries) {
      r = compileRap(textShort, rhymes, config.rap.num_lines)
      tries++
    }

    if (tries === config.bot.max_retries) {
      console.log('Fail: Could not satisfy character limit.'); return}

    // Tweet rap (w/ 'dispersion throttling')
    disperse(() => {
      T.post('statuses/update', {
        in_reply_to_status_id: id,
        status: '@' + receiver + ' ' + body
      }, (err, data, resp) => {
        if (err) {
          console.log('ERROR: Issue posting tweet.')
          console.log(err)
          return
        }
        const receiver = data.in_reply_to_screen_name
        const when     = data.created_at
        console.log('Success: Rap sent to @' + receiver, '(' + when + ')')
      })
    }, 500, 6500)

  }, err => {
    console.log('Fail: Could not fetch rhymes.')
    console.log(err)
  })
})

function ellipFront(str, numCharsKept) {
  const  l = str.length
  return l > numCharsKept ? '…' + ltrim(str.substring(l - numCharsKept, l)) : str
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

// Returns a rap given the first line for the rap, an array of valid rhymes,
// and the number of lines desired in the finished rap
// Returns undefined if there if cannot make rap
function compileRap(firstLine, validRhymes, numLines) {
  let lines  = shuffled(config.rap.templates.slice())
  let rhymes = shuffled(validRhymes.slice())
  let numNewLines = numLines-1
  let rap = firstLine

  for (let i = 0; i < numNewLines; i++)
    rap += '\n' + lines.pop()

  if (rhymes.length < rap.match(/_/g).length) {
    console.log('Error: Can\'t make rap, not enough rhymes.')
    return undefined }

  if (lines.length < numNewLines) {
    console.log('Error: Can\'t make rap, not enough templates.')
    return undefined }

  return rap.split('').map(c => (c === '_') ? rhymes.pop() : c).join('')
}

// Terminal says hello :)
console.log('  _ \\                _ )        |   \n    \/   _` |  _ \\    _ \\   _ \\   _| \n _|_\\ \\__,_| .__\/   ___\/ \\___\/ \\__| \n            _|')
console.log('(Made w/ <3 by @johnchinjew)')
console.log('RUNNING...')
