var qs = require('querystring');
var routes = [];
var self = module.exports;

let HTML_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATH'];

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
    let routeParamRegex = new RegExp(/(\:).*?(?=\/|\/|$)/g);
    //Remove the treading '/' from Routes. IE /user/ = /user..
    route = route.replace(/\/+$/, "");

    let routeParams = route.match(routeParamRegex);
    let regexRoute = route;

    if (routeParams !== null) {
        //Replace each (:paramName) with a regex match for all characters. (Should add a method to allow creating own regex for a variable, perhaps parse out regex between [] braces?)
        routeParams.forEach(element => {
            regexRoute = regexRoute.replace(element, "(.*)");
        });
        routes.push({ regexRoute: regexRoute, route: route, method: method.toUpperCase(), action: action });
    } else {
        routes.push({ route: route, method: method.toUpperCase(), action: action });
    }
}

exports.getRoutes = () => {
    return routes;
}

//Extracting params from URLs
const extractParams = (req, res, route) => {
    //If the url is .com/route?p=p&p2=p2
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
    } else {
        return disperse(route, req, res);
    }
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
    req.url = req.url.replace(/\/+$/, "");

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
        if (route.regexRoute !== undefined && req.url.match(route.regexRoute) !== null && req.method == route.method)
            return disperse(route, req, res);
    }
    //No routes were hit, 404. 
    res.writeHead(404, {
        'Content-Length': Buffer.byteLength("404 NOT FOUND"),
        'Content-Type': 'text/plain'
    });
    res.end("404 NOT FOUND");
}

