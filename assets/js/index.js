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

/* === formatPhone ===
Formats numbers from '1234567890' to '(123) 456-7890'
=== formatPhone ===*/
function formatPhone(num) {
  var numString;
  numString =
    "(" + num.slice(0, 3) + ") " + num.slice(3, 6) + "-" + num.slice(6, 10);
  return numString;
}

/* === updateBreweries ===
Empties the brewery list and then fills with query results
=== updateBreweries ===*/
function updateBreweries(breweryData) {
  var ulEl = $("#brewery-list");
  var lineEl;
  var phoneNum;
  var breweryText;

  // clear out the old list
  ulEl.empty();
  // fill in with the new
  for (let i = 0; i < breweryData.length; i++) {
    // only show if brewery is open
    if (breweryData[i].brewery_type !== "closed") {
      // set up HTML elements for list and link
      lineEl = $("<li>");
      linkEl = $("<a>");
      // add a URL if it exists
      if (!!breweryData[i].website_url) {
        linkEl.attr("href", breweryData[i].website_url);
        linkEl.attr("target", "_blank");
      }
      // format phone number
      phoneNum = formatPhone(breweryData[i].phone);
      // sets up brewery info into a string
      breweryText = `${breweryData[i].name} - `;
      breweryText += `${breweryData[i].street}, ${breweryData[i].city}, ${breweryData[i].state} `;
      breweryText += `${breweryData[i].postal_code} - ${phoneNum}`;
      // appends elements
      linkEl.text(breweryText);
      lineEl.append(linkEl);
      ulEl.append(lineEl);
    }
  }
}

/* === updatePoem ===
Simple implementation (needs love)
Finds the line in the poem that mentions beer and them updates HTML with stanza
=== updatePoem ===*/
function updatePoem(poemData, searchTerm) {
  var poemEl = $("#poem-snippet");
  var pEl;
  var lines = poemData[0].lines;
  var author = poemData[0].author;
  var title = poemData[0].title;
  var startIndex;
  var beerIndex;
  var endIndex;

  // if the poem is short, include the whole thing otherwise try to find a stanza
  if (lines.length <= 10) {
    startIndex = 0;
    endIndex = lines.length - 1;
  } else {
    // examine each line for the term "beer" and returns the line number
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "") {
        startIndex = i;
      }
      if (lines[i].includes(searchTerm)) {
        beerIndex = i;
        break;
      }
    }
    // as long as "beer" has been found tries to find the end of the stanza
    // otherwise reruns the poem fetch
    if (!!beerIndex) {
      for (let i = beerIndex; i < lines.length; i++) {
        if (lines[i] === "") {
          endIndex = i;
          break;
        }
      }
    } else {
      console.log("Beer is missing from poem");
      getPoem();
      return;
    }
    // if start or endpoint hasn't been found or the stanza is too long
    if (!endIndex || !startIndex || endIndex - startIndex > 10) {
      // if beer is on an odd numbered line capture 4 lines ending in beer
      if (beerIndex % 2 > 0) {
        startIndex = beerIndex - 3;
        endIndex = beerIndex;
      } else {
        // otherwise grab 4 lines ending with the line after beer
        startIndex = beerIndex - 2;
        endIndex = beerIndex + 1;
      }
    }
  }
  // empty the poem element
  poemEl.empty();

  // add the title
  pEl = $("<h3>");
  pEl.text(`${title}`);
  poemEl.append(pEl);
  // add the poetry lines to the poem element
  for (let i = startIndex; i <= endIndex; i++) {
    pEl = $("<p>");
    pEl.text(lines[i]);
    poemEl.append(pEl);
  }
  // add the author
  pEl = $("<p>");
  pEl.attr("id", "author");
  pEl.text(`--${author}`);
  poemEl.append(pEl);
}

/* === getPoem ===
Fetches a random poem that mentions "beer" from poetrydb.org
=== getPoem ===*/
async function getPoem() {
  var searchTerm;
  var num;
  var currentApi;
  var poemData;
  var poem;

  // randomly choose one of four search terms
  num = Math.random();
  if (num < 0.25) {
    searchTerm = " ale";
  } else if (num  < 0.5) {
    searchTerm = "beer";
  } else if (num < .75) {
    searchTerm = "saloon";
  } else {
    searchTerm = "tavern";
  }
  currentApi = `https://poetrydb.org/random,lines/1;${searchTerm}`;

  poemData = await fetch(currentApi);
  poem = await poemData.json();
  updatePoem(poem, searchTerm);
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
  localStorage.setItem("breweryLocation", cityName);
  getBreweryApi(cityName);
}

/* === MAIN ===
Sets up the search button listener
=== MAIN ===*/
var cityName = localStorage.getItem("breweryLocation");
if (!!cityName) {
  getBreweryApi(cityName);
}
searchButton.on("click", handleSearch);