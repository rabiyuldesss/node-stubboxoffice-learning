
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const ejs = require('ejs');
const helmet = require('helmet');
const debug = require('debug')('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const redis_store = require('redis');

// load all the application enviornment variables
// const dotenv_res = dotenv.config({ path: '../.env' });
const dotenv_res = dotenv.config({ path: '.env' });
// check for error, throw if there is one
if (dotenv_res.error) throw dotenv_res.error

// use the server defined port else use the port given
const port = process.env.PORT || 3000;

// for getting/setting cookies
app.use(cookieParser());
// set the view engine to ejs
app.set('view engine', 'ejs');
// helps protect from well-known vulnerabilities by setting HTTP headers appropriately
app.use(helmet());
// hide the header showing underlying infrastructure
app.disable('x-powered-by');
// compression/zip for responses
app.use(compression());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json({type: 'application/json'}));

//static file options
let staticFileOptions = {
    dotfiles: 'ignore',
    etag: false,
    index: false,
    maxAge: '365d',
    redirect: false,
    setHeaders: function(res, path, stat) {
        res.set('x-timestamp', Date.now());
        res.set('Cache-Control', 'public, max-age=72000');
        res.set('Expires', 72000);
    }
};
// serve assests from default /assets folder and rename to /public
app.use('/public', express.static(__dirname + '/assets', staticFileOptions));

app.use('/sitemap.xml', express.static(__dirname + '/assets/sitemap.xml'));
app.use('/google0ba59b26bb387e62.html', express.static(__dirname + '/assets/google0ba59b26bb387e62.html'));

//added for 301 redirect begin
app.use((req, res, next) => {
    var host = req.get('Host');
    if (host === 'http://stubboxoffice.com/') {
        return res.redirect(301, 'https://stubboxoffice.com/');
    }
    if (host === 'http://www.stubboxoffice.com/') {
        return res.redirect(301, 'http://www.stubboxoffice.com/');
    }
    if (host === 'https://stubboxoffice.com/') {
        return res.redirect(301, 'https://stubboxoffice.com/');
    }
    if (host === 'https://www.stubboxoffice.com/') {
        return res.redirect(301, 'https://www.stubboxoffice.com/');
    }
  return next();
});

//301 end

// initialize knex for mysql database
const knex = require('./knex/knex.js');

// initialize connection to redis store
const redis = redis_store.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
// on successfully connected to Redis
redis.on('connect', () => console.log(`Redis connected at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}...\n`));
// on error connectiing to Redis
redis.on('error', () => console.log(`ERROR: Redis couldn't connect at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}!!\n`));

// use the given middleware w/ the express app
require('./middleware')(app);
// use the routes && pass the express app, knex
require('./routes')(app, knex, redis);

// start the application on the given port
const server = app.listen(port, () => console.log(`Launching Application on Port: ${port} with PID: ${process.pid}`));

// display mysql version
knex.raw("SELECT VERSION()")
	.then((version) => console.log(`Using MySQL version ${version[0][0]['VERSION()']}`))
	.catch((err) => console.log(err));

// on SIGTERM signal
process.on('SIGTERM', () => {
	// close http server
	server.close(() => {
		// close connection to redis
		redis.end(true);

		// close knex connection to mysql db
		knex.destroy(() => {
			console.log('close knex');
			process.exit(0);
		});
	});
});
