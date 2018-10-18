const qs = require('querystring');

const rmvDeliminatorRGX = new RegExp(/\/+$/);
const self = module.exports;

var routes = [];

let HTML_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATH'];

//Register each HTML Request Method as a function, ie. router.get(), router.post() ...
HTML_METHODS.forEach((m) => {
    exports[m.toLowerCase()] = (route, action) => {
        self.route(route, m, action);
    }
});

const parseBody = (req, callback) => {
    var body = '';
    req.on('data', (data) => body += data);
    req.on('end', () => callback(qs.parse(body)));
}


exports.route = (route, method, action) => {
    //Extract parameters (:paramName) from URL. 
    let routeParamRegex = new RegExp(/(\:).*?(?=\/|\/|\-|\.|$)/g);
    //Remove the treading '/' from Routes. IE /user/ = /user..
    route = route.replace(rmvDeliminatorRGX, "");

    let routeParams = route.match(routeParamRegex);
    let regexRoute = route;
    regexRoute = regexRoute.replace(".", "\\.");
    if (routeParams !== null) {
        let params = [];
        //Replace each (:paramName) with a regex match for all characters. (Should add a method to allow creating own regex for a variable, perhaps parse out regex between [] braces?)
        routeParams.forEach(element => {
            params.push(element);
            regexRoute = regexRoute.replace(element, "(.*)");
        });
        routes.push({ regexRoute: regexRoute, route: route, method: method.toUpperCase(), action: action, params: params });
    } else {
        routes.push({ route: route, method: method.toUpperCase(), action: action });
    }
}

exports.getRoutes = () => {
    return routes;
}

//Extracting params from URLs
const extractParams = (req, res, route) => {
    req.params = {};
    //If the url is .com/route?p=p&p2=p2 (GETs?)
    if (req.url.includes("?")) {
        //Regex to extract the 'querystring' from the url.
        let qsRegex = new RegExp(/(?<=\?).*/g);
        let qstring = req.url.match(qsRegex);
        req.params = qs.parse(qstring[0], "&", "=");
        return disperse(route, req, res);
    }
    if (req.method == "POST") {
        parseBody(req, function (data) {
            req.params = data;
            return disperse(route, req, res);
        });
    }

    if (req.method == "GET" && route.regexRoute !== undefined) {
        let routeParamMatches = req.url.match(route.regexRoute);
        console.log(route.regexRoute);
        console.log(routeParamMatches);
        for (let i = 0; i < route.params.length; i++) {
            req.params[route.params[i].replace(":", "")] = routeParamMatches[i + 1];
        }
        return disperse(route, req, res);
    }
    console.log("Finished Extract Params, must be no params?");
    return disperse(route, req, res);
}

const disperse = (route, req, res) => {
    if (typeof route.action === "function") {
        return route.action(req, res);
    } else if (typeof route.action === "string") {

    } else if (typeof route.action === "undefined") {

    }
}

exports.handle = (req, res) => {
    //Remove 'querystring' from a URL. 
    let removeQSRegex = new RegExp(/.+?(?=\?)/g);
    //Remove trailing / from URL. 
    req.url = req.url.replace(rmvDeliminatorRGX, "");

    //Try to match absolute routes
    for (r in routes) {
        let route = routes[r];
        if ((req.url.match(removeQSRegex) == null ? route.route == req.url : req.url.match(removeQSRegex)[0] == route.route) && req.method == route.method) {
            return extractParams(req, res, route);
        }
    }

    //Try to match regex routes
    for (r in routes) {
        let route = routes[r];
        if (route.regexRoute !== undefined && req.url.match(route.regexRoute) !== null && req.method == route.method) {
            return extractParams(req, res, route);
        }
    }
    //No routes were hit, 404. 
    res.writeHead(404, {
        'Content-Length': Buffer.byteLength("404 NOT FOUND"),
        'Content-Type': 'text/plain'
    });
    res.end("404 NOT FOUND");
}
