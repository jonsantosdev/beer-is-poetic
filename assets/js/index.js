const DEFAULT_CITY = "Hilo";
var searchButton = $("#location-btn");
var inputText = $("#location-input");
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
  var ulEl = $("#brewery-list");  // unordered list used to list brewery info
  var lineEl;       // line element for unordered list
  var headerEl;     // brewery header element
  var pEl;          // paragraph element displays address and holds buttons/links
  var breweryText;  // brewery address
  var satBtnEl;     // satellite update button
  var phoneBtnEl;   // call phone button
  var urlBtnEl;     // brewery website button
  var anchorEl;     // anchor element used for URL and phone

  // clear out the old list
  ulEl.empty();
  // fill in with the new
  for (let i = 0; i < breweryData.length; i++) {
    // only show if brewery is open
    if (breweryData[i].brewery_type !== "closed") {
      satBtnEl = $("<button>");
      phoneBtnEl = $("<button>");
      urlBtnEl = $("<button>");

      // set up line to hold brewery header and info
      lineEl = $("<li>");
      // set up header
      headerEl = $("<h5>")
      headerEl.text(breweryData[i].name);
      // set up paragraph element for all other data
      pEl = $("<p>");
      // brewery address text
      breweryText = `${breweryData[i].street}, ${breweryData[i].city}, ${breweryData[i].state} `;
      breweryText += `${breweryData[i].postal_code}  `;
      pEl.text(breweryText);
      // add a URL button if it exists
      if (!!breweryData[i].website_url) {
        anchorEl = $("<a>");
        anchorEl.attr("href",breweryData[i].website_url);
        anchorEl.attr("target","_blank");
        urlBtnEl.text("🌐");
        urlBtnEl.attr("id", "urlBtn" + i);
        anchorEl.append(urlBtnEl);
        pEl.append(anchorEl);
      }
      // add phone number button if it exists
      if (!!breweryData[i].phone) {
        anchorEl = $("<a>");
        anchorEl.attr("href","tel:" + breweryData[i].phone);
        phoneBtnEl.text("📱");
        phoneBtnEl.attr("id", "phoneBtn" + i);
        anchorEl.append(phoneBtnEl);
        pEl.append(anchorEl);
      }
      // add update sat image button if coords exit
      if (!!breweryData[i].longitude && !!breweryData[i].latitude) {
        satBtnEl.text("🗺️")
        satBtnEl.attr("id","satBtn" + i);
        satBtnEl.attr("data-lon", breweryData[i].longitude);
        satBtnEl.attr("data-lat", breweryData[i].latitude);
        satBtnEl.attr("data-name", breweryData[i].name);
        pEl.append(satBtnEl);  
        satBtnEl.on("click", handleSatBtn)
      }
      // append header and paragraph to line
      lineEl.append(headerEl);
      lineEl.append(pEl);
      // append line to unordered list element
      ulEl.append(lineEl);
    }
  }
}

/* === handleSatBtn ===
Pulls the longitude and latitude data from button element when user clicks
on the update Satellite button for a brewery and then updates the sat image.
=== handleSatBtn ===*/
function handleSatBtn(event) {
  var btnEl = $(event.target);
  var lon = btnEl.attr("data-lon");
  var lat = btnEl.attr("data-lat");
  var name = btnEl.attr("data-name");
  getSatImageByCoord(lon, lat, name);
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

/* === getSatImageByCoord ===
Fetches the satellite image from NASA  from the parameters latitude and longitude.
=== getSatImageByCoord ===*/
function getSatImageByCoord(lon, lat, breweryName) {
  var satelliteApi = `https://api.nasa.gov/planetary/earth/assets?lon=${lon}&lat=${lat}&date=2014-01-01&&dim=0.10&api_key=${apiKey}`;
  var headerEl = $("#brewery-name");

  headerEl.text(breweryName);
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

/* === getSatImage ===
Fetches the satellite image from NASA from the brewery data's latitude and longitude.
=== getSatImage ===*/
function getSatImage(breweryData) {
  var lon = breweryData[0].longitude;
  var lat = breweryData[0].latitude;
  var satelliteApi = `https://api.nasa.gov/planetary/earth/assets?lon=${lon}&lat=${lat}&date=2014-01-01&&dim=0.10&api_key=${apiKey}`;
  var headerEl = $("#brewery-name");

  headerEl.text(breweryData[0].name);
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
Handles the search request when enter is pressed
=== handleSearch ===*/
function handleSearch(event) {
  var cityName = $("#location-input").val();
  // checking for the key input with ASCII code for "enter"
  if (event.which === 13) {
    localStorage.setItem("breweryLocation", cityName);
    getBreweryApi(cityName);  
  }
}

/* === handleBtnClick ===
Handles the search request when the search button is clicked
=== handleBtnClick ===*/
function handleBtnClick () {
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
inputText.keypress(handleSearch);
searchButton.on("click", handleBtnClick);