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
        renderSearchResults();
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
        request.onload = function() { 
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.responseText);
                setFavorites(data);
            } else {
                throw new Error("Unable to complete AJAX request due to server error");
            }
        };
        request.send(query);
    }

    
    // Search

    var lastSearchResults = [];
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

    function addClass(element, className) {
        /* Adds the favorite class to DOM element and returns it */
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += " " + className;
        }
        return element;
    }
    
    function renderSearchResults(searchResults) {
        /* 
         Iterates through search results and appends a table row for each listing 
         
         Each row looks like: 
         <tr><td>Star Wars</td><td><a href="#">Favorite</a></td></tr>
         
         */
        searchResults = searchResults || lastSearchResults;
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
                $titleTD.id = id;
                $titleTD.addEventListener("click", showMovieDetails);
                $favTD.appendChild($a);
                $tr.appendChild($titleTD);
                $tr.appendChild($favTD);
                if (id in favorites) {
                    $tr = addClass($tr, "favorite");
                }
                $table.appendChild($tr);
            }
        }
    }

    function clearSearchResults() {
        var $table = document.querySelectorAll(".movie-list")[0];
        $table.innerHTML = "";
    }
    
    function searchForTerm(event) {
        /* Check the cache or api for search results, and display */
        var searchTerm = event.target.value,
            searchResults = [];
        if (searchTerm) {
            if (cache[searchTerm]) { // if the term exists in the cache, use it
                searchResults = lastSearchResults = cache[searchTerm];
                renderSearchResults(searchResults);
            } else { // otherwise get the results from the api and add to the cache
                searchTitle(searchTerm, function(data) {
                    if (data.Search) {
                        searchResults = data.Search;
                        cache[searchTerm] = lastSearchResults = searchResults;
                        renderSearchResults(searchResults);
                    }
                });
            }
        } else {
            clearSearchResults();
            hideMovieDetails();
        }
    }

    // Movie details

    function isValidImage(filename) {
        /* returns true if the filename ends in an image extension */
        return /\.jpg$|\.png$|\.gif$|\.svg$/.test(filename.trim());
    }
    
    function renderMovieDetails(data) {
        /* Injects movie data into details area */
        if (data) {
            var poster = document.getElementById("movie-poster"),
                title = document.getElementById("movie-title"),
                year = document.getElementById("movie-year"),
                rating = document.getElementById("movie-rating"),
                director = document.getElementById("movie-director"),
                cast = document.getElementById("movie-cast"),
                plot = document.getElementById("movie-plot"),
                details = document.getElementById("movie-details");
            poster.src = isValidImage(data.Poster) ? data.Poster : "no_image.svg",
            title.innerHTML = data.Title || "";
            year.innerHTML = data.Year || "";
            rating.innerHTML = data.Rated || "";
            director.innerHTML = data.Director || "";
            cast.innerHTML = data.Actors || "";
            plot.innerHTML = data.Plot || "";
            details.style.display = "block";
        }
    }
    
    function showMovieDetails(event) {
        /* Searches the clicked movie and renders the result */
        if (event.target.id) {
            searchId(event.target.id, renderMovieDetails);
        }
    }

    function hideMovieDetails() {
        var details = document.getElementById("movie-details");
        details.style.display = "none";
    }

    // Init
    
    var $form = document.getElementById(SEARCH_FORM_ID);
    var $input = document.getElementById(SEARCH_INPUT_ID);

    $input.addEventListener("keyup", searchForTerm);
 
    fetchFavorites();
    
}();


    


