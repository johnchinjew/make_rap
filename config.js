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
config.rap.num_rhymes  = 48 // Num rhymes to fetch (>= num '_' in any rap)
config.rap.max_retries = 32 // Max retries for making a rap for a tweet

// Templates for generating raps
config.rap.templates = [
  "From the west side spittin some _",
  "Got a fity under arm & u got _",
  "10 times better, u aint _",
  "Chillin relaxin, actin lika _",
  "Makin me cry, u nothin but a _",
  "Funny to me, u bouta be _",
  "Im the _ & the _, jus call me _",
  "For my brotha, 6 feet under _",
  "Later, I be kickin _ by the _",
  "Hah what? U think this all a _",
  "Here shootin some _ outside the _",
  "Cruisin down main wit my ultra _",
  "Y'know nothin can stop my super _",
  "I be that _, ya stuck as a _",
  "I dont think ya tryna get on my _",
  "We're the _, kickin _ & chewin _",
  "Cant stop me, Im top of the _",
  "Yall look up at me, you & your _",
  "Stole your _, bouta steal your _",
  "So many chains on my neck call me _",
  "So many likes on the gram—lika _",
  "Everyone y'know calls me _",
  "Takin vacation, down at the _",
  "Im king of _, u only be a _",
  "24/7 cant never reach my _",
]

module.exports = config
