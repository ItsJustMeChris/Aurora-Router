var routes = [];

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

exports.extractParams = (req, route) => {
}

const disperse = (route, req, res) => {
    if (typeof route.action === "function") {
        return route.action(req, res);
    } else if (typeof route.action === "string") {

    } else if (typeof route.action === "undefined") {

    }
}

exports.handle = (req, res) => {
    req.url = req.url.replace(/\/+$/, "");
    console.log(req.url);
    //Try to match absolute routes
    for (r in routes) {
        let route = routes[r];
        if (route.route == req.url && req.method == route.method)
            return disperse(route, req, res);
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

