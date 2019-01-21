const qs = require('querystring');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const rmvDeliminatorRGX = new RegExp(/\/+$/);
const removeQSRegex = new RegExp(/.+?(?=\?)/g);
const qsRegex = new RegExp(/(?<=\?).*/g);

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
  const routeParamRegex = new RegExp(/(:).*?(?=\/|\/|-|\.|$)/g);
  let r = route;
  r = r.replace(rmvDeliminatorRGX, '');
  r = r.charAt(0) === '/' ? r : `/${r}`;

  const params = r.match(routeParamRegex);
  let regexRoute = r;

  regexRoute = regexRoute.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  if (params !== null) {
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
  } else {
    routes.push({
      route,
      method: method.toUpperCase(),
      action,
    });
  }

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

exports.handle = (req, res) => {
  req.url = req.url.replace(rmvDeliminatorRGX, '') === '' ? '/' : req.url.replace(rmvDeliminatorRGX, '');
  const staticFile = path.join(self.staticFolder, '..', req.url);
  serveStatic(req, res, staticFile);
  let hit = false;
  routes.forEach((route) => {
    if ((req.url.match(removeQSRegex) == null ? route.route === req.url : req.url.match(removeQSRegex)[0] === route.route) && (req.method === route.method || route.method === 'ALL')) {
      hit = true;
      return extractParams(req, res, route);
    }
    if (route.regexRoute !== undefined && req.url.match(route.regexRoute) !== null && (req.method === route.method || route.method === 'ALL')) {
      hit = true;
      return extractParams(req, res, route);
    }
    return route;
  });
  if (!hit) {
    res.writeHead(404, {
      'Content-Length': Buffer.byteLength('404 NOT FOUND'),
      'Content-Type': 'text/plain',
    });
    return res.end('404 NOT FOUND');
  }
  return true;
};
