const shipsUrl = "https://api.worldofwarships.com/wows/encyclopedia/ships/?application_id=3d7de89f74fffaa6db9329d2bb351f63&fields=name%2C+images%2C+nation%2C+type%2C+tier";
let nations;
let shipTypes;
const minPage = 1;
let pageNumElement;
let maxPage = 8;

window.onload = (e) => {
    let infoUrl = "https://api.worldofwarships.com/wows/encyclopedia/info/?application_id=3d7de89f74fffaa6db9329d2bb351f63&fields=ship_nations%2C+ship_types";

    //Sets up button events, stores display data, and reads local storage data
    function initPage(e){
        let data = JSON.parse(e.target.responseText).data;
        
        nations = data["ship_nations"];
        shipTypes = data["ship_types"];
        pageNumElement = document.querySelector("#pageNum");

        //#region Button events
        document.querySelector("#searchButton").onclick = () => {
            pageNumElement.innerHTML = minPage;
            document.querySelector("#prev").disabled = true;
            search()
        };
        document.querySelector("#prev").onclick = () => {
            pageNumElement.innerHTML--;
            search();
            document.querySelector("#next").disabled = false; 
            if (pageNumElement.innerHTML == minPage) { document.querySelector("#prev").disabled = true;}
        }
        document.querySelector("#next").onclick = () => {
            pageNumElement.innerHTML++;
            search();
            document.querySelector("#prev").disabled = false;
            if (pageNumElement.innerHTML == maxPage) { document.querySelector("#next").disabled = true;}
        }
        //#endregion

        let nationSelect = document.querySelector("#nation");
        let shipTypeSelect = document.querySelector("#shipType");
        let tierSelect = document.querySelector("#tier");

        //#region setDropdowns
        for (let nation in nations){
            let option = document.createElement("option");
            option.value = nation;
            option.innerHTML = nations[nation];
            nationSelect.appendChild(option);
        }
        for (let type in shipTypes){
            let option = document.createElement("option");
            option.value = type;
            option.innerHTML = shipTypes[type];
            shipTypeSelect.appendChild(option);
        }
        for (let i = 1; i < 12; i++){
            let option = document.createElement("option");
            option.innerHTML = i;
            tierSelect.appendChild(option);
        }
        //#endregion

        //#region Local storage stuff
        let storedType = localStorage.getItem("tmb3614-shipFinder-filterType");
        let storedNation = localStorage.getItem("tmb3614-shipFinder-filterNation");
        let storedTier = localStorage.getItem("tmb3614-shipFinder-filterTier");

        if (storedType != null){
            shipTypeSelect.value = storedType;
        }
        if (storedNation != null){
            nationSelect.value = storedNation;
        }
        if (storedTier != null){
            tierSelect.value = storedTier;
        }
        //#endregion
    };

    //Set up page with default info
    getData(infoUrl, initPage);

    //Perform initial search to display data
    getData(shipsUrl, search);
};

function search(){
    let url = shipsUrl;

    let tier = document.querySelector("#tier").value;
    let nation = document.querySelector("#nation").value;
    let shipType = document.querySelector("#shipType").value;

    //#region Store filters in local storage
    localStorage.setItem("tmb3614-shipFinder-filterType", shipType);
    localStorage.setItem("tmb3614-shipFinder-filterNation", nation);
    localStorage.setItem("tmb3614-shipFinder-filterTier", tier);
    //#endregion

    url += `&nation=${nation}`;
    url += `&type=${shipType}`;
    url += `&page_no=${pageNumElement.innerHTML}`;

    //Changes page select button to match pages given and filters data based on ship tier
    function filterTier(e){
        let data = JSON.parse(e.target.responseText);

        maxPage = data.meta.page_total;
        
        if (maxPage == minPage || pageNumElement.innerHTML == maxPage){
            document.querySelector("#next").disabled = true;
        }
        else {
            document.querySelector("#next").disabled = false;
        }
    
        data = data.data;

        if (tier > 0){
            let filteredData = {};
    
            let filteredValues = Object.values(data).filter((ship) => ship.tier == tier);
    
            for (let i = 0; i < filteredValues.length; i++){
                filteredData[Object.keys(data).find(key => data[key] == filteredValues[i])] = filteredValues[i];
            }

            data = filteredData;
        }

        loadShips(data);
    }

    getData(url, filterTier);
}

//Queries URL and calls method passed in when it has a result
function getData(url, method = search){
    document.body.style.cursor = "wait";
    document.body.querySelectorAll("button").forEach(element => element.style.cursor = "wait");

    let xhr = new XMLHttpRequest();

    xhr.onload = method;

    xhr.open("GET", url);
    xhr.send();
}

//Takes data entered, formats and displays them
function loadShips(data){
    let contentSection = document.querySelector("#content");
    contentSection.innerHTML = "";

    for (let ship in data){
        let shipElement = document.createElement("div");
        shipElement.className = "ship";
        
        let img = document.createElement("img");
        img.src = data[ship]["images"]["small"];
        img.alt = data[ship]["name"];

        let info = document.createElement("span");
        info.innerHTML = "Tier " + data[ship]["tier"] + " " + shipTypes[data[ship]["type"]] + " - " + data[ship]["name"];

        shipElement.appendChild(img);
        shipElement.appendChild(info);
        contentSection.appendChild(shipElement);
    }
    document.body.style.cursor = "auto";
    document.body.querySelectorAll("button").forEach(element => element.style.cursor = "auto");
}