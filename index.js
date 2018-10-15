var routes = [];
var self = module.exports;

exports.route = (route, method, action) => {
    let trueRoute = route.match(".+?(?=\/:|$)");
    trueRoute[0] = trueRoute[0].replace(/\/+$/, "");
    routes[trueRoute] = { route: route, method: method, action: action };
}

exports.getRoutes = () => {
    return routes;
}

//Not Yet implemented
exports.extractParams = (req, route) => {
}

const disperse = (route, req, res) => {
    if (typeof route.action === "function") {
        return route.action(req, res);
    } else if (typeof route.action === "string") {
        //return controller.action(req, res);
    } else if (typeof route.action === "undefined") {
        //return fire router hooks (basically just a callback, so not really sure why its needed, but eh why not!)
    }
}

exports.router = (req, res) => {
    req.url = req.url.replace(/\/+$/, "");
    if (routes[req.url]) {
        let r = routes[req.url];
        if (r.method.toUpperCase() == req.method) {
            return disperse(r, req, res);
        }
    } else {
        for (r in routes) {
            let reqParamCount = (req.url.replace(r, '').match(/(?<=\/).*?(?=\/|\/|$)/g) || []).length;
            let routeParamCount = (routes[r].route.match(/(?<=\:).*?(?=\/|\/|$)/g) || []).length;

            if (req.url.indexOf(r) != -1 && reqParamCount == routeParamCount && routes[r].method.toUpperCase() == req.method) {
                return disperse(r, req, res);
            }
        }
    }
    res.write("404");
    res.end();
}