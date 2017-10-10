require('dotenv').config()

let config = {}

// Twitter bot settings
config.bot             = {}
config.bot.screen_name = 'make_rap'
config.bot.char_limit  = 140

// API keys from .env
config.bot.keys                     = {}
config.bot.keys.consumer_key        = process.env.CONSUMER_KEY
config.bot.keys.consumer_secret     = process.env.CONSUMER_SECRET
config.bot.keys.access_token        = process.env.ACCESS_TOKEN
config.bot.keys.access_token_secret = process.env.ACCESS_TOKEN_SECRET

// Rap config settings
config.rap             = {}
config.rap.num_lines   = 4
config.rap.num_rhymes  = 64 // Num rhymes to fetch (>= num '_' in any rap)
config.rap.max_retries = 32 // Max retries for making a rap for a tweet

// Templates for generating raps
config.rap.templates = [
  "from the westside spittin that _",
  "got a fity under arm, u got _",
  "10 times better, u aint _",
  "chillin relaxin, actin lika _",
  "makin me cry, u nothin but a _",
  "funny to me, u bouta be _",
  "im the _ n the _, jus call me _",
  "for my brotha, 6 feet under _",
  "later, i be kickin _ by the _",
  "hah what? u think this all a _",
  "here shootin some _ outside the _",
  "cruisin down main wit my ultra _",
  "y'know nothin can stop my super _",
  "i be that _, ya stuck as a _",
  "do ya think u cud pickup my _",
  "we're the _, kickin _ n chewin _",
  "cant stop me, im top of the _",
  "yall cant take _, you or your _",
  "stole your _, bouta steal your _",
  "_! so many chains on my _",
  "so many likes on the gram—lika _",
  "everyone y'know calls me _",
  "takin vacation, down at the _",
  "im king of _, u only be a _",
  "24/7 cant never reach my _",
  "this a _, this a _, this a _",
]

module.exports = config
