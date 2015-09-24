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


    // Favorites

    var favorites = {};

    function setFavorites(obj) {
        favorites = obj;
        displaySearchResults();
    }
    
    function fetchFavorites() {
        ajax("/favorites",  setFavorites);
    }
    
    function setFavorite(id) {
        /* POST a new favorite to the Favorites API */
        var request = new XMLHttpRequest(),
            query = "oid=" + id; // TODO: Make this work with an object instead of querystring
        request.open('POST', 'http://localhost:3000/favorites', true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.onload = function() { // Supporting only IE9+ to avoid more boilerplate
            if (request.status >= 200 && request.status < 400) {
                // Successful request + response
                var data = JSON.parse(request.responseText);
                setFavorites(data);
            } else {
                // TODO: use onError callback?
                throw new Error("Unable to complete AJAX request due to server error");
            }
        };
        request.send(query);
    }

    
    // Search

    var searchTerm = "";
    var searchResults = [];
    var cache = {};  // TODO: cache server side too?
    
    
    function getFavoriteLink(id) {
        /* Constructs an anchor tag to favorite a movie title */
        var $a = document.createElement("a");
        $a.href = "#";
        $a.innerHTML = "Favorite";
        $a.addEventListener("click", function() { 
            setFavorite(id); // this works because the callback is a closure
        });
        return $a;
    }

    function addFavoriteClass(element) {
        /* Adds the favorite class to DOM element and returns it */
        var className = "favorite";
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += " " + className;
        }
        return element;
    }
    
    function displaySearchResults() {
        /* 
         Iterates through search results and appends a table row for each listing 
         
         Each row looks like: 
         <tr><td>Star Wars</td><td><a href="#">Favorite</a></td></tr>
         
         */
        var $table = document.querySelectorAll(".movie-list")[0];
        if (searchResults.length) { // don't bother if there's nothing to show
            $table.innerHTML = "";  // clear out the last results
            for (var i = 0; i < searchResults.length; i++) {
                var $tr = document.createElement("tr"),
                    $titleTD = document.createElement("td"),
                    $favTD = document.createElement("td"),
                    title = searchResults[i].Title,
                    id = searchResults[i].imdbID,
                    $a = getFavoriteLink(id, title);
                $titleTD.innerHTML = title; 
                $favTD.appendChild($a);
                $tr.appendChild($titleTD);
                $tr.appendChild($favTD);
                if (id in favorites) {
                    $tr = addFavoriteClass($tr);
                }
                $table.appendChild($tr);
            }
        }
    }
    
    function searchForTerm() {
        /* Check the cache or api for search results, and display */
        if (searchTerm) {
            if (cache[searchTerm]) { // if the term exists in the cache, use it
                searchResults = cache[searchTerm];
                displaySearchResults();
            } else { // otherwise get the results from the api and add to the cache
                searchTitle(searchTerm, function(data) {
                    if (data.Search) {
                        searchResults = data.Search;
                        cache[searchTerm] = searchResults;
                        displaySearchResults();
                    }
                });
            }
        }
    }

    var $form = document.getElementById(SEARCH_FORM_ID);
    var $input = document.getElementById(SEARCH_INPUT_ID);

    function setSearchTerm() {
        searchTerm = $input.value;
    }
        
    $input.addEventListener("change", setSearchTerm);
 
    $form.addEventListener("submit", function(e) { // using submit to support pressing Enter in input box
        e.preventDefault();
        searchForTerm();
        $input.value = "";
    });

    fetchFavorites();
    
}();


    


