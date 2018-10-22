const qs = require('querystring');

const rmvDeliminatorRGX = new RegExp(/\/+$/);
const self = module.exports;

let routes = [];

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
    let routeParamRegex = new RegExp(/(\:).*?(?=\/|\/|\-|\.|$)/g);
    route = route.replace(rmvDeliminatorRGX, "");
    route = route.charAt(0) === "/" ? route : "/" + route;

    let routeParams = route.match(routeParamRegex);
    let regexRoute = route;

    regexRoute = regexRoute.replace(".", "\\.");
    if (routeParams !== null) {
        let params = [];
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

const extractParams = (req, res, route) => {
    req.params = {};
    if (req.url.includes("?")) {
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
        for (let i = 0; i < route.params.length; i++) {
            req.params[route.params[i].replace(":", "")] = routeParamMatches[i + 1];
        }
        return disperse(route, req, res);
    }
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
    let removeQSRegex = new RegExp(/.+?(?=\?)/g);
    req.url = req.url.replace(rmvDeliminatorRGX, "");

    for (r in routes) {
        let route = routes[r];
        if ((req.url.match(removeQSRegex) == null ? route.route == req.url : req.url.match(removeQSRegex)[0] == route.route) && req.method == route.method) {
            return extractParams(req, res, route);
        }
    }

    for (r in routes) {
        let route = routes[r];
        if (route.regexRoute !== undefined && req.url.match(route.regexRoute) !== null && req.method == route.method) {
            return extractParams(req, res, route);
        }
    }

    res.writeHead(404, {
        'Content-Length': Buffer.byteLength("404 NOT FOUND"),
        'Content-Type': 'text/plain'
    });
    res.end("404 NOT FOUND");
}
