const DEFAULT_CITY = "Hilo";
var searchButton = $("#location-btn");
var apiKey = "hbKzDhi94GYMB46doP1uTf3omUBWddT1aUWkFl8I"; //for NASA query

/* === updateSatImage ===
Adds satellite image URL to image source
=== updateSatImage ===*/
function updateSatImage(satData) {
  var imageEl = $("#sat-image");

  imageEl.attr("src", satData.url);
}

/* === updateBreweries ===
Empties the brewery list and then fills with query results
=== updateBreweries ===*/
function updateBreweries(breweryData) {
  var ulEl = $("#brewery-list");
  var lineEl;

  // clear out the old list
  ulEl.empty();
  // fill in with the new
  for (let i = 0; i < breweryData.length; i++) {
    lineEl = $("<li>");
    lineEl.text(breweryData[i].name);
    ulEl.append(lineEl);
  }
}

/* === updatePoem ===
Simple implementation (needs love)
Finds the line in the poem that mentions beer and them updates HTML with that line
=== updatePoem ===*/
function updatePoem(poemData) {
  var poemEl = $("#poem-snippet");
  var lines = poemData[0].lines;
  var beerLine;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("beer")) {
        beerLine = lines[i];
        break;
    }
  }
  poemEl.text(beerLine);
}

/* === getPoem ===
Fetches a random poem that mentions "beer" from poetrydb.org
=== getPoem ===*/
function getPoem() {
  var currentApi = "https://poetrydb.org/random,lines/1;beer/lines.json";

  fetch(currentApi)
    .then(function (response) {
      if (!response.ok) {
        alert("Poem not found!");
      }
      return response.json();
    })
    // once the data arrives, update the HTML
    .then(updatePoem);
}

/* === getSatImage ===
Fetches the satellite image from NASA for a brewery based on its latitude and longitude.
=== getSatImage ===*/
function getSatImage(breweryData) {
  var lon = breweryData[0].longitude;
  var lat = breweryData[0].latitude;
  var satelliteApi = `https://api.nasa.gov/planetary/earth/assets?lon=${lon}&lat=${lat}&date=2014-01-01&&dim=0.10&api_key=${apiKey}`;

  // function call to update the brewery list
  updateBreweries(breweryData);
  // fetches the satellite image, once complete calls function to update html
  fetch(satelliteApi)
    .then(function (response) {
      if (!response.ok) {
        alert("Satellite data not found!");
      }
      return response.json();
    })
    .then(updateSatImage);
}

/* === getBreweryApi ===
Fetches the data for a city based on its name.
=== getBreweryApi ===*/
function getBreweryApi(cityName) {
  var cityString;
  var currentApi;

  // if the cityName is undefined, use the default
  if (!cityName) {
    cityName = DEFAULT_CITY;
    addToSearch = false;
  }
  // run the poem API call
  getPoem();

  // replace spaces to set up for URL
  cityString = cityName.replace(" ", "_");
  currentApi = `https://api.openbrewerydb.org/v1/breweries?by_city=${cityString}&per_page=10`;

  fetch(currentApi)
    .then(function (response) {
      if (!response.ok) {
        alert("Brewery data not found!");
      }
      return response.json();
    })
    // once the data arrives, fetch the satellite image
    .then(getSatImage);
}

/* === handleSearch ===
Handles the search request when the search button is clicked
=== handleSearch ===*/
function handleSearch() {
  var cityName = $("#location-input").val();
  getBreweryApi(cityName);
}

/* === MAIN ===
Sets up the search button listener
=== MAIN ===*/
searchButton.on("click", handleSearch);
