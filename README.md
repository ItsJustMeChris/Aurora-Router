npm i aurora-router

# Aurora-Router
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
        if (req.url != '/favicon.ico') { //Right now the router will not ignore favicon requests by default, I can add it in a near future update.  
            router.handle(req, res);
        }
    }).listen(8080);

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

    //When calling a controller/action in like this, it's important to setup the Controller path, see setControllerPath(path); 
    //Case matters since we are requiring a node module without parsing the entire folder upon disperse of the route. 
    //See TODO file as controllers still need a bit more work for a full implementation I can comfortable with. 
    router.get("/route", "Controller.Action");

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

Router Errors:
(These error codes will be displayed upon an HTTP 500 error when the router fails to bind to a route or fails to disperse an action. )
    Error Codes:

    1: Router failed to find a valid method to disperse route.  
    2: Router failed with string value for callback, typically this is meant to be a controller and action (Controller.Action), or a view and page (View#Page).  
    3: Failed to bind to controller, normally the file is not found, meaning the path is incorrect, it's important to note that the router requires the path to end in \\ ("\") or ("/") depending on OS. 
