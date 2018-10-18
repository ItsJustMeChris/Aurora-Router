var qs = require('querystring');
var routes = [];

const parseBody = (req, callback) => {
    var body = '';
    req.on('data', (data) => body += data);
    req.on('end', () => callback(qs.parse(body)));
}


exports.route = (route, method, action) => {
    let routeParamRegex = new RegExp(/(\:).*?(?=\/|\/|$)/g);
    route = route.replace(/\/+$/, "");

    let routeParams = route.match(routeParamRegex);
    let regexRoute = route;

    if (routeParams !== null) {
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

const extractParams = (req, res, route) => {
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

    } else {

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
    let postRegex = new RegExp(/.+?(?=\?)/g);
    req.url = req.url.replace(/\/+$/, "");

    //Try to match absolute routes
    for (r in routes) {
        let route = routes[r];
        if ((req.url.match(postRegex) == undefined ? route.route == req.url : req.url.match(postRegex)[0] == route.route) && req.method == route.method) {
            return extractParams(req, res, route);
        }
    }

    //Try to match regex routes
    for (r in routes) {
        let route = routes[r];
        if (route.regexRoute !== undefined && req.url.match(route.regexRoute) !== null && req.method == route.method)
            return disperse(route, req, res);
    }
    res.write("404");
    res.end();
}

