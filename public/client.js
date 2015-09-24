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
        SEARCH_FORM_ID = "search-form",
        SEARCH_INPUT_ID = "search-term";
        


    function ajax(url, callback) {
        /* Send AJAX GET to URL and pass result to callback */
        
        var request = new XMLHttpRequest(); 
        request.open('GET', url, true);

        request.onload = function() { // Supporting only IE9+ to avoid more boilerplate
            if (request.status >= 200 && request.status < 400) {
                // Successful request + response
                var data = JSON.parse(request.responseText);
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

    function searchTitle(title, callback) {
        /* Search the database for movie title and pass result to callback */
        var query = "s=" + title;
        ajax(API_URL + query, callback);
    }

    function searchId(id, callback) {
        /* Get details about a particular movie */
        var query = "i=" + id;
        ajax(API_URL + query, callback);
    }
    // Search

    var searchTerm = "";
    var searchResults = [];

    function displaySearchResults() {
        var $list = document.querySelectorAll(".movies")[0];
        if (searchResults.length) {
            $list.innerHTML = "";
            for (var i = 0; i < searchResults.length; i++) {
                var $li = document.createElement("li"),
                    title = searchResults[i].Title,
                    id = searchResults[i].imdbID;
                $li.innerText = title;
                $li.id = id;
                $list.appendChild($li);
            }
        }
    }
    
    function searchForTerm() {
        if (searchTerm) {
            searchAPI(searchTerm, function(data) {
                if (data.Search) {
                    searchResults = data.Search;
                    displaySearchResults();
                }
            });
        }
    }

    var $form = document.getElementById(SEARCH_FORM_ID);
    var $input = document.getElementById(SEARCH_INPUT_ID);

    function setSearchTerm() {
        searchTerm = $input.value;
    }
        
    $input.addEventListener("change", setSearchTerm);
 
    $form.addEventListener("submit", function(e) {
        e.preventDefault();
        searchForTerm();
        $input.value = "";
    });
    
}();


    


