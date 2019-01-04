const qs = require('querystring');
const rmvDeliminatorRGX = new RegExp(/\/+$/);
const self = module.exports;
const path = require('path');
const fs = require('fs');
const mime = require('mime-types')

let routes = [];
let controllerPath = "";

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

    regexRoute = regexRoute.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    if (typeof action === "string") {
        if (action.includes(".")) {
            let [controllerName, actionName] = action.split(".");
            try {
                let controller = require(controllerPath + controllerName + ".js");
                if (typeof controller[actionName] === 'undefined') throw new Error('Controller: \'' + controllerName + '\', Action: \'' + actionName + '\' not found.');
                action = controller[actionName];
            }
            catch (e) {
                throw e;
            }
        } else {
            throw new Error('Invalid input in route action field, unsupported action method or invalid action method expression');
        }
    }

    if (routeParams !== null) {
        routeParams.forEach(element => {
            regexRoute = regexRoute.replace(element, "(.*)");
        });

        routes.push({ regexRoute: regexRoute, route: route, method: method.toUpperCase(), action: action, params: routeParams });
    } else {
        routes.push({ route: route, method: method.toUpperCase(), action: action });
    }

    routes.sort((a, b) => {
        if (a.regexRoute !== undefined) {
            return 1;
        } else {
            return -1;
        }
    });
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
        for (let mw in self.middleware) {
            mw(req, res);
        }
        return route.action(req, res);
    } else if (typeof route.action === 'undefined') {
        //Hooks
    }
}

exports.middleware = [];

exports.addMiddleWare = (cb) => {
    self.middleware.push(cb);
}

exports.setControllerPath = (path) => {
    controllerPath = path;
}

exports.staticDir = (staticFolder) => {
    self.staticFolder = staticFolder;
}

const serveStatic = (req, res, staticFile) => {
    let mt = mime.lookup(staticFile);
    if (fs.existsSync(staticFile) && !fs.lstatSync(staticFile).isDirectory() && mt !== false) {
        res.writeHead(200, { 'Content-type': mt });
        let data = fs.readFileSync(staticFile, { encoding: 'utf8' });
        res.write(data);
        res.end();
    }
}



exports.handle = (req, res) => {
    let removeQSRegex = new RegExp(/.+?(?=\?)/g);
    req.url = req.url == "/" ? req.url : req.url.replace(rmvDeliminatorRGX, "");
    let staticFile = path.join(self.staticFolder, '..', req.url)

    serveStatic(req, res, staticFile);

    for (r in routes) {
        let route = routes[r];
        if ((req.url.match(removeQSRegex) == null ? route.route == req.url : req.url.match(removeQSRegex)[0] == route.route) && req.method == route.method) {

            return extractParams(req, res, route);
        }
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