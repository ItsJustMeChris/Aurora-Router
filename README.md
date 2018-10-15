

# Aurora-Router
Aurora router is still being built. 

Aurora Router is the router used for the Aurora Node.js MVC

Aurora router is a simple, but powerful router. The goal of this router is to make creating routes very simple, by implementing routing this way, you allow the text editor of your choice to be able to give you better intellisense recommendations. 

Implementations:
(These are not all implemented yet, but are planned. )

    let router = require('aurora-router');
    
    //Route using the routers Page.View method.
    router.route('/', 'get', 'index.view');
    
    //Route using the routers Page.View method.
    router.route('/', 'get', 'pages/index.view'); 
     
    //Route using a callback with parameters. 
    router.route('/user/:id', 'get', (req, res) => {
        res.write("User/:id");
        res.end();
    });
     
    //Route using a callback to a static URL. 
    router.route('/user/panel', 'get', (req, res) => {
        res.write("user/panel");
        res.end();
    });
     
    //Route using the routers Controller#Action method. 
    router.route('/user/update', 'post', 'User#update')
