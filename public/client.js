var Client = Client || function() {

    // Debug
    
    function log(message) {
        /* Logs messages to debug console */
        if (window.console && window.console.log) { 
            console.log(message);
        } // else ignore if console unsupported
    }

    // API
    
    var API_URL = "http://www.omdbapi.com/?",
        TEMPLATE_URL = "template.html",
        ROOT_SELECTOR = "#app";

    function ajax(url, callback) {
        /* Send AJAX GET to URL and pass result to callback */
        
        var request = new XMLHttpRequest(); 
        request.open('GET', url, true);

        request.onload = function() { // Supporting only IE9+ to avoid more boilerplate
            if (request.status >= 200 && request.status < 400) {
                // Successful request + response
                var data = request.responseText;
                callback(data);
            } else {
                // TODO: use onError callback?
                throw new Error("Unable to complete AJAX request due to server error");
            }
        };

        request.onerror = function() {
            throw new Error("Unable to complete AJAX request due to connection error");
        };
        
        request.send();
    }

    function searchAPI(title, callback) {
        /* Search the database for movie title and pass result to callback */
        var query = "s=" + title;
        ajax(API_URL + query, callback);
    }

    // DOM

    function loadTemplate(selector, callback) {
        /* Inject template html into selector, passes reference to resulting DOM element to callback */
        var $root = document.querySelectorAll(selector)[0] || document.body; // default to body if no matching elems
       
        ajax(TEMPLATE_URL, function(html) {
            $root.innerHTML = html; // TODO: Make this safe
            if (typeof callback === "function") {
                callback($root);
            }
        });
    }

    loadTemplate(ROOT_SELECTOR); // Paint the template


}();


    


