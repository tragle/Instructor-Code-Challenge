var Client = Client || function() {

    // Debug
    
    function log(message) {
        /* Logs messages to debug console */
        if (window.console && window.console.log) { 
            console.log(message);
        } // else ignore if console unsupported
    }

    // Globals

    var favorites = {},
        lastSearchResults = [],
        searchCache = {},
        detailsCache = {};

    var API_URL = "http://www.omdbapi.com/?",
        REFRESH_RATE_MS = 3000;
    
    // API
    


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


    function setFavorites(obj) {
        /* update the local copy of favorites */
        favorites = obj;
        renderSearchResults(); // we re-render because the model now includes a new favorite
    }
    
    function fetchFavorites() {
        /* get favorites from server and update local copy */
        ajax("/favorites",  setFavorites);
    }
    
    function addFavorite(id) {
        /* POST a new favorite to the Favorites API */
        var request = new XMLHttpRequest(),
            query = "oid=" + id; // TODO: Make this work with an object instead of querystring
        request.open('POST', 'http://localhost:3000/favorites', true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.onload = function() { 
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.responseText);
                setFavorites(data); // the POST returns updated favorites list, which we can now save
            } else {
                throw new Error("Unable to complete AJAX request due to server error");
            }
        };
        request.send(query);
    }

    // Search

    function getFavoriteLink(id) {
        /* Constructs an anchor tag to favorite a movie title */
        var $a = document.createElement("a");
        $a.href = "#";
        $a.innerHTML = "&#9786;"; // smiley
        $a.title = "Add favorite"; // this will display a tooltip on mouse hover
        $a.addEventListener("click", function() { 
            addFavorite(id); // this works because the callback is a closure
        });
        $a = addClass($a, "fav-control");
        return $a;
    }

    function addClass(element, className) {
        /* Adds specified class to DOM element and returns it */
        if (element.classList) { // have to do this two ways to support IE
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
        searchResults = searchResults || lastSearchResults; // if nothing is passed in, just use last results
        var $table = document.querySelectorAll("#movie-list")[0]; // TODO: use config instead of element id
        if (searchResults.length) { // don't bother if there's nothing to show
            $table.innerHTML = "";  // clear out the last results
            for (var i = 0; i < searchResults.length; i++) {
                var $tr = document.createElement("tr"),
                    $titleTD = document.createElement("td"),
                    $favTD = document.createElement("td"),
                    title = searchResults[i].Title,
                    id = searchResults[i].imdbID,
                    $a = getFavoriteLink(id, title);
                // first TD contains the title
                $titleTD.innerHTML = title;
                $titleTD.id = id;
                $titleTD.addEventListener("click", showMovieDetails);
                // second TD will contain an anchor tag
                // TODO: Use span instead of anchor?
                if (id in favorites) { 
                    $a = addClass($a, "favorite"); 
                }
                $favTD.appendChild($a);
                // add the TD's to the TR, and the TR to the table
                $tr.appendChild($titleTD);
                $tr.appendChild($favTD);
                $table.appendChild($tr);
            }
        }
    }

    function clearSearchResults() {
        var $table = document.querySelectorAll("#movie-list")[0];
        $table.innerHTML = "";
    }
    
    function searchForTerm(event) {
        /* Check the cache or api for search results, and display */
        var searchTerm = event.target.value,
            searchResults = [];
        if (searchTerm) {
            if (searchCache[searchTerm]) { // if the term exists in the cache, use it
                searchResults = lastSearchResults = searchCache[searchTerm];
                renderSearchResults(searchResults);
            } else { // otherwise get the results from the api and add to the cache
                searchTitle(searchTerm, function(data) {
                    if (data.Search) {
                        searchResults = data.Search;
                        searchCache[searchTerm] = lastSearchResults = searchResults;
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
        if (data) { // TODO: remove hardcoded ids
            var poster = document.getElementById("movie-poster"),
                title = document.getElementById("movie-title"),
                year = document.getElementById("movie-year"),
                rating = document.getElementById("movie-rating"),
                director = document.getElementById("movie-director"),
                cast = document.getElementById("movie-cast"),
                plot = document.getElementById("movie-plot"),
                details = document.getElementById("movie-details");
            // Not all movies have posters, so use default if it's missing
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
        /* Searches the cache, then the api for the clicked movie and renders the result */
        var movieId = event.target.id;
        if (movieId) { 
            if (movieId in detailsCache) { // use the cached details if they exist
                renderMovieDetails(detailsCache[movieId]);
            } else {
                searchId(movieId, function(data) { // otherwise get from api and add to cache
                    renderMovieDetails(data);
                    detailsCache[movieId] = data;
                });
            }
        } // TODO: something constructive if the id is missing
    }

    function hideMovieDetails() {
        var details = document.getElementById("movie-details");
        details.style.display = "none";
    }

    // Init
    
    var $input = document.getElementById("search-term");

    $input.addEventListener("keyup", searchForTerm); // search while typing
 
    fetchFavorites();
    setInterval(fetchFavorites, REFRESH_RATE_MS); // Periodically download favorites in case other users have made changes
    
}();


    


