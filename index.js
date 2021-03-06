const qs = require('querystring');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const rmvDeliminatorRGX = new RegExp(/\/+$/);
const removeQSRegex = new RegExp(/.+?(?=\?)/g);
const qsRegex = new RegExp(/(?<=\?).*/g);
const routeParamRegex = new RegExp(/(:).*?(?=\/|\/|-|\.|$)/g);

const self = module.exports;

const routes = [];

const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATH', 'ALL'];

HTTP_METHODS.forEach((m) => {
  exports[m.toLowerCase()] = (route, action) => {
    self.route(route, m, action);
  };
});

const parseBody = (req, callback) => {
  let body = '';
  req.on('data', (data) => {
    body += data;
  });
  req.on('end', () => callback(qs.parse(body)));
};

exports.route = (route, method, action) => {
  const r = route.replace(rmvDeliminatorRGX, '').charAt(0) === '/' ? route : `/${route}`;

  const params = r.match(routeParamRegex) || [];
  let regexRoute = params.length > 0 ? r.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : undefined;

  params.forEach((element) => {
    regexRoute = regexRoute.replace(element, '(.*)');
  });

  routes.push({
    regexRoute,
    route,
    method: method.toUpperCase(),
    action,
    params,
  });

  routes.sort((a) => {
    if (a.regexRoute !== undefined) {
      return 1;
    }
    return -1;
  });
};

const disperse = (route, req, res) => {
  if (typeof route.action === 'function') {
    self.middleware.forEach((mw) => {
      mw(req, res);
    });
    return route.action(req, res);
  }
  return false;
};

const extractParams = (req, res, route) => {
  req.params = {};
  if (req.url.includes('?')) {
    const qstring = req.url.match(qsRegex);
    req.params = qs.parse(qstring[0], '&', '=');
    return disperse(route, req, res);
  }
  if (req.method === 'POST') {
    parseBody(req, (data) => {
      req.params = data;
      return disperse(route, req, res);
    });
  }
  if (req.method === 'GET' && route.regexRoute !== undefined) {
    const routeParamMatches = req.url.match(route.regexRoute);
    for (let i = 0; i < route.params.length; i += 1) {
      req.params[route.params[i].replace(':', '')] = routeParamMatches[i + 1];
    }
    return disperse(route, req, res);
  }
  return disperse(route, req, res);
};

exports.middleware = [];

exports.addMiddleWare = (cb) => {
  self.middleware.push(cb);
};

exports.staticDir = (staticFolder) => {
  self.staticFolder = staticFolder;
};

const serveStatic = (req, res, staticFile) => {
  const mt = mime.lookup(staticFile);
  if (fs.existsSync(staticFile) && !fs.lstatSync(staticFile).isDirectory() && mt !== false) {
    res.writeHead(200, { 'Content-type': mt });
    const data = fs.readFileSync(staticFile);
    res.write(data);
    res.end();
  }
};

const testQS = (url, route) => {
  return url.match(removeQSRegex) == null
    ? route.route === url : url.match(removeQSRegex)[0] === route.route;
};

const testMethod = (req, route) => req.method === route.method || route.method === 'ALL';

const testRouteRegex = (url, route) => {
  return route.regexRoute !== undefined && url.match(route.regexRoute) !== null;
};

exports.handle = (req, res) => {
  const url = req.url.replace(rmvDeliminatorRGX, '') === '' ? '/' : req.url.replace(rmvDeliminatorRGX, '');
  const staticFile = path.join(self.staticFolder, '..', url);
  serveStatic(req, res, staticFile);
  for (let i = 0; i < routes.length; i += 1) {
    const route = routes[i];
    if (testQS(url, route) && testMethod(req, route)) {
      return extractParams(req, res, route);
    }
    if (testRouteRegex(url, route) && testMethod(req, route)) {
      return extractParams(req, res, route);
    }
  }
  res.writeHead(404, {
    'Content-Length': Buffer.byteLength('404 NOT FOUND'),
    'Content-Type': 'text/plain',
  });
  return res.end('404 NOT FOUND');
};
