const fetch = require('node-fetch')

async function get (url) {
  const res = await fetch(url)
  return res.json()
}

module.exports = get
