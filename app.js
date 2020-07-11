const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const beers = require('./routes/beers');
const upload = require('./routes/upload');
const bars = require('./routes/bars');
const users = require('./routes/users');
const Sentry = require('@sentry/node');

Sentry.init({
	dsn: process.env.SENTRY
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true,limit:'10mb' }));
app.use(cors());

app.use('/beers', beers);
app.use('/bars', bars);
app.use('/upload', upload);
app.use('/users', users);

app.use(function(err, req, res, next) {
  if (err.status === 500) {
    Sentry.captureException(Error(err.content.message));
  }
  res.status(err.status).json(err.content);
});



const port = process.env.PORT || 5001;
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
})

app.get('/', function (req, res) {
    res.send('Currently working!');
});
