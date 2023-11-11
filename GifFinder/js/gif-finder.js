// 1
window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
			
// 2
let displayTerm = "";

// 3
function searchButtonClicked(){
    console.log("searchButtonClicked() called");

    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";
    
    const GIPHY_KEY = "5PuWjWVnwpHUQPZK866vd7wQ2qeCeqg7";

    let url = GIPHY_URL;
    url += "api_key=" + GIPHY_KEY;

    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    term = encodeURIComponent(term.trim());

    if (term.length < 1) return;

    url += "&q=" + term;

    let limit = document.querySelector("#limit").value;

    url += "&limit=" + limit;

    document.querySelector("#status").innerHTML = "<b>Searching for '" + displayTerm + "'</b>";

    getData(url);
}

function getData(url){
    let xhr = new XMLHttpRequest();

    xhr.onload = dataLoaded;

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

function dataLoaded(e){
    let xhr = e.target;

    console.log(xhr.responseText);

    let obj = JSON.parse(xhr.responseText);

    if (!obj.data || obj.data.length == 0){
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'</b>";
        return;
    }

    let results = obj.data;

    console.log("Results length: " + results.length);
    
    let bigString = "";

    for (let i = 0; i < results.length; i++){
        let result = results[i];

        let smallUrl = result.images.fixed_width.url;
        if (!smallUrl) smallUrl = "images/no-images-found.png";

        let url = result.url;

        let line = `<div class='result'><img src='${smallUrl}' title='${result.id}' />`;
        line += `<span><a target='_blank' href='${url}'>View on Giphy</a>`;
        line += `<p>Rating: ${result.rating.toUpperCase()}</p></span></div>`;

        bigString += line;
    }

    document.querySelector("#content").innerHTML = bigString;

    document.querySelector("#status").innerHTML = "<b>Sucsess!</b><p><i>Here are " + results.length + " results for '" + displayTerm + "'</i></p>";
}

function dataError(e){
    console.log("An error occurred");
}