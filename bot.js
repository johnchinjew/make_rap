const Twit     = require('twit')
const Datamuse = require('datamuse')
const SwearJar = require('swearjar')
const config   = require('./config')

const T = new Twit(config.bot.keys)
const stream = T.stream('user')

// Listen for tweets
stream.on('tweet', t => {
  const senderName   = t.user.screen_name
  const senderId     = t.id_str
  const receiverName = t.in_reply_to_screen_name
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
  console.log('Note: Tweet recieved from @'+senderName+ ' ('+when+')')

  // Fetch rhymes
  Promise.all([
    Datamuse.words({rel_rhy: textLastWord, max: fetchMax, md: 'p'}),
    Datamuse.words({rel_nry: textLastWord, max: fetchMax, md: 'p'})
  ]).then(resps => {
    // Flatten responses and extract nouns
    let rhymes = [].concat(...resps).map(w => {
      if ('tags' in w) {
        if (w.tags.includes('n'))
          return w.word
      }
      return false
    }).filter(w => w)

    // Generate rap satisfying Twitter char limit
    let rapToTweet = compileRap(textShort, rhymes, config.rap.num_lines)
    if (!rapToTweet) return

    const trueCharLimit = config.bot.char_limit - senderName.length - 2
    let tries = 0

    while (rapToTweet.length > trueCharLimit && tries < config.rap.max_retries) {
      rapToTweet = compileRap(textShort, rhymes, config.rap.num_lines)
      tries++
    }

    if (rapToTweet.length > trueCharLimit) {
      console.log('Fail: Could not satisfy character limit.'); return}

    // Tweet rap in reply to sender (w/ dispersion throttling)
    disperse(() => {
      T.post('statuses/update', {
        in_reply_to_status_id: senderId,
        status: '@' + senderName + ' ' + rapToTweet,
      }, (err, data, resp) => {
        if (err) {
          console.log('Error: Issue posting tweet.')
          console.log(err)
          return
        }
        console.log('Success: Rap sent to @'+data.in_reply_to_screen_name, '('+data.created_at+')')
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
// Returns undefined if cannot make rap
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
