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
  var ulEl = $("#brewery-list"); // unordered list used to list brewery info
  var lineEl; // line element for unordered list
  var headerEl; // brewery header element
  var pEl; // paragraph element displays address and holds buttons/links
  var breweryText; // brewery address
  var satBtnEl; // satellite update button
  var phoneBtnEl; // call phone button
  var urlBtnEl; // brewery website button
  var anchorEl; // anchor element used for URL and phone

  for (let i = 0; i < breweryData.length; i++) {
    // only show if brewery is open
    if (breweryData[i].brewery_type !== "closed") {
      satBtnEl = $("<button>");
      phoneBtnEl = $("<button>");
      urlBtnEl = $("<button>");

      // set up line to hold brewery header and info
      lineEl = $("<li>");
      lineEl.addClass("mb-2.5");
      // set up header
      headerEl = $("<h5>");
      headerEl.addClass("font-bold text-lg italic text-yellow-600");
      headerEl.text(breweryData[i].name);
      // set up paragraph element for all other data
      pEl = $("<p>");
      pEl.addClass("text-sm mb-1 ml-2.5");
      // brewery address text
      if (!breweryData[i].street) {
        breweryText = "";
      } else {
        breweryText = `${breweryData[i].street}, `;
      }
      breweryText += `${breweryData[i].city}, ${breweryData[i].state} `;
      breweryText += `${breweryData[i].postal_code}  `;
      pEl.text(breweryText);
      // add a URL button if it exists
      if (!!breweryData[i].website_url) {
        anchorEl = $("<a>");
        anchorEl.attr("href", breweryData[i].website_url);
        anchorEl.attr("target", "_blank");
        urlBtnEl.text("🌐");
        urlBtnEl.attr("id", "urlBtn" + i);
        anchorEl.append(urlBtnEl);
        pEl.append(anchorEl);
      }
      // add phone number button if it exists
      if (!!breweryData[i].phone) {
        anchorEl = $("<a>");
        anchorEl.attr("href", "tel:" + breweryData[i].phone);
        phoneBtnEl.text("📱");
        phoneBtnEl.attr("id", "phoneBtn" + i);
        anchorEl.append(phoneBtnEl);
        pEl.append(anchorEl);
      }
      // add update sat image button if coords exit
      if (!!breweryData[i].longitude && !!breweryData[i].latitude) {
        satBtnEl.text("🗺️");
        satBtnEl.attr("id", "satBtn" + i);
        satBtnEl.attr("data-lon", breweryData[i].longitude);
        satBtnEl.attr("data-lat", breweryData[i].latitude);
        satBtnEl.attr("data-name", breweryData[i].name);
        pEl.append(satBtnEl);
        satBtnEl.on("click", handleSatBtn);
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
  getSatImageApi(lon, lat, name);
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
    // as long as searchTerm has been found tries to find the end of the stanza
    // otherwise fetches another poem
    if (!!beerIndex) {
      for (let i = beerIndex; i < lines.length; i++) {
        if (lines[i] === "") {
          endIndex = i;
          break;
        }
      }
    } else {
      console.log(`${searchTerm} is missing from poem`);
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
  pEl.addClass("text-2xl font-bold italic mb-1 text-amber-300");
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
  pEl.addClass("text-xl text-amber-300");
  // pEl.attr("id", "author");
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
  } else if (num < 0.5) {
    searchTerm = "beer";
  } else if (num < 0.75) {
    searchTerm = "saloon";
  } else {
    searchTerm = "tavern";
  }
  currentApi = `https://poetrydb.org/random,lines/1;${searchTerm}`;

  poemData = await fetch(currentApi);
  poem = await poemData.json();
  updatePoem(poem, searchTerm);
}

/* === getSatImageApi ===
Fetches the satellite image from NASA using latitude and longitude.
=== getSatImageApi ===*/
function getSatImageApi(lon, lat, breweryName) {
  var satelliteApi;
  var headerEl = $("#brewery-name");
  var imageEl = $("#sat-image");

  headerEl.text(breweryName);
  headerEl.addClass("text-2xl font-bold italic mb-2 text-amber-300");
  imageEl.attr("src", "");

  if (lon && lat) {
    satelliteApi = `https://api.nasa.gov/planetary/earth/assets?lon=${lon}&lat=${lat}&date=2014-01-01&&dim=0.10&api_key=${apiKey}`;
    fetch(satelliteApi)
      .then(function (response) {
        if (!response.ok) {
          var errorDialogEl = $("#error-dialog");
          var errorMsgEl = $("#error-message");
          errorMsgEl.text("Satellite data not found!");
          errorDialogEl.attr("title", "Oops!");
          errorDialogEl.dialog();
        }
        return response.json();
      })
      .then(updateSatImage);
  }
}

/* === getSatImage ===
Finds the first valid longitude and latitude and call functions to update the image as well
as the brewery list
=== getSatImage ===*/
function getSatImage(breweryData) {
  var lon;
  var lat;
  var breweryName;

  // Runs through the brewery data until the proper longitude and latitude data are found.
  for (let i = 0; i < breweryData.length; i++) {
    if (breweryData[i].longitude && breweryData[i].latitude) {
      lon = breweryData[i].longitude;
      lat = breweryData[i].latitude;
      breweryName = breweryData[i].name;
      break;
    }
  }
  getSatImageApi(lon, lat, breweryName);
  updateBreweries(breweryData);
}

/* === getBreweryApi ===
Fetches the data for a city based on its name.
=== getBreweryApi ===*/
function getBreweryApi(cityName) {
  var cityString;
  var currentApi;
  var headerEl;
  var ulEl = $("#brewery-list"); // unordered list used to list brewery info

  // clear the brewery list and add a header
  ulEl.empty();
  headerEl = $("<h2>");
  headerEl.addClass("text-3xl font-bold italic mb-2 text-amber-600");
  headerEl.text(cityName);
  ulEl.append(headerEl);
  // if the cityName is undefined, use the default
  if (!cityName) {
    cityName = DEFAULT_CITY;
    addToSearch = false;
  }
  // run the poem API call
  getPoem();
  // replace spaces to set up for URL
  cityString = cityName.replace(" ", "_");
  currentApi = `https://api.openbrewerydb.org/v1/breweries?by_city=${cityString}&per_page=50`;
  // fetches the brewery data
  fetch(currentApi)
    .then(function (response) {
      if (!response.ok) {
        var errorDialogEl = $("#error-dialog");
        var errorMsgEl = $("#error-message");
        errorMsgEl.text("Brewery data not found!");
        errorDialogEl.attr("title", "Oops!");
        errorDialogEl.dialog();
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
function handleBtnClick() {
  var cityName = $("#location-input").val();
  localStorage.setItem("breweryLocation", cityName);
  getBreweryApi(cityName);
}

/* === MAIN ===
Sets up the search button listener
=== MAIN ===*/
var cityName = localStorage.getItem("breweryLocation");
if (cityName) {
  getBreweryApi(cityName);
}
inputText.keypress(handleSearch);
searchButton.on("click", handleBtnClick);
