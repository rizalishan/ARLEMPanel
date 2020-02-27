const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const RateLimit = require('express-rate-limit')
const config = require('./config/default.json')
// const sv = require('./backend/helpers/validationMiddleware')

console.log(config.baseUrl)

var limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
})

const indexHTML = (() => {
  return fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8')
})()

// app.use(sv)
app.use(limiter)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/dist', express.static(path.resolve(__dirname, './dist')))

app.use(expressValidator())
require('./backend/helpers/checkError')(app)
require('./build/dev-server')(app)
// require('./backend/services')(app)

app.get('*', (req, res) => {
  res.write(indexHTML)
  res.end()
})

const port = process.env.PORT || 8081
app.listen(port, () => {
  console.log(`server started at http://127.0.0.1:${port}`)
})
