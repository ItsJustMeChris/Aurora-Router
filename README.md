


# Aurora-Router
Aurora router is still being built. 

Aurora Router is the router used for the Aurora Node.js MVC

Aurora router is a simple, but powerful router. The goal of this router is to make creating routes very simple, by implementing routing this way, you allow the text editor of your choice to be able to give you better intellisense recommendations. 

View: https://github.com/ItsJustMeChris/Aurora for a working 'app' example. 

Implementations:
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

Planned Implementations:
(These are not currently finished, but are planned)

    router.get('/route', 'Controller.Action');
    router.get('/route', 'View#Page');
