# Aurora-Router
    
    npm i aurora-router
    
Aurora router is still being built. 

Aurora Router is the router used for the Aurora Node.js MVC

Aurora router is a simple, but powerful router. The goal of this router is to make creating routes very simple, by implementing routing this way, you allow the text editor of your choice to be able to give you better intellisense recommendations. 

View: https://github.com/ItsJustMeChris/Aurora for a working 'app' example. 

Router setup on a Node.JS HTTP server. 

    let router = require('aurora-router');
    let http = require('http');
    //You can setup routes in the main file, or in another file and load it in with require. 
    //require('./router');
    
    //If you're using controllers and the routers default controller path finding does not work, you can set your own path with
    router.setControllerPath("Path\\To\\Controllers\\"); //Currently a trailing "\" or "/" is required, depending on OS. 

    http.createServer(function (req, res) {
        if (req.url != '/favicon.ico') { 
            router.handle(req, res);
        }
    }).listen(8080);

    //If you want to use router.handle() without a favicon ignore, you will need to handle it like so. 
    //This can also just be written into the fs.createReadStream('Path/To/Favico').pipe(res) instead of a variable. 
    const FAVICO = "PATH TO FAVICO";

    router.get('/favicon.ico', (req, res) => {
        res.setHeader('Content-Type', 'image/x-icon');
        //Pipe the favicon to the response.  
        fs.createReadStream(FAVICO).pipe(res);
    });

Routing Implementations:
(These methods of making a router are implemented and supported)

    router.get('/route', (req, res) => {
        //Do stuff..
    });
    
    router.get('/route/:param', (req, res) => {
        //Do stuff..
    });
    
    router.get('/flights/:airport1-:airport2', (req, res) => {
        //Do stuff..
    });
    
    router.route('/user/:genus.:species', 'get', (req, res) => {
        //Do stuff..
    });
    
    router.post('/post', (req, res) => {
        //Do stuff..
    });
    
    //router.<HTML_METHOD>('/route', callback);
    //router.route('/route','method', callback);

    //When calling a controller/action like this, it's important to setup the Controller path, see setControllerPath(path); 
    //Case matters since we are requiring a node module without parsing the entire folder upon disperse of the route. 
    //See TODO file as controllers still need a bit more work for a full implementation I can comfortable with. 
    router.get("/route", "Controller.Action");

Serving Static Files:
    router.staticDir(path.join(__dirname, '..', 'views', 'assets'));
    //Inside of HTML just simply link them as so
    <link rel="stylesheet" href="./assets/css/main.css">

Planned Implementations:
(These are not currently finished, but are planned)

    router.get('/route', 'View#Page');

Example Controller Format:
(This is a pretty standard method of creating controllers I feel)

    //Controller.js
    exports.action = (req, res) => {
        res.write("Controller/action called");
        res.end();
    }

UPDATE LOG:
    1.0.13:
        Static file serving. 
    1.0.9: 
        Controllers/Actions are now cached.  Reworked some error handling. 
        Controller error handling handled during app start/route creation/caching.  Validates existance of controller and action before end user gets a server error.  