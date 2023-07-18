
/*
 * apply middleware to application
 * app ----- express application
 */

// import middlewares
const requireLocation = require("./location.js");


// apply/use the middlewares
module.exports = (app) => {

	// sets the user location and zipcode as a cookie
	app.use(requireLocation);

}
