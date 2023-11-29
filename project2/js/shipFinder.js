const shipsUrl = "https://api.worldofwarships.com/wows/encyclopedia/ships/?application_id=3d7de89f74fffaa6db9329d2bb351f63&fields=name%2C+images%2C+nation%2C+type%2C+tier";
let nations;
let shipTypes;
const minPage = 1;
let pageNum = 1;
let maxPage = 8;

window.onload = (e) => {
    let infoUrl = "https://api.worldofwarships.com/wows/encyclopedia/info/?application_id=3d7de89f74fffaa6db9329d2bb351f63&fields=ship_nations%2C+ship_types";

    function initPage(e){
        let data = JSON.parse(e.target.responseText);
        
        data = data.data;
        
        nations = data["ship_nations"];
        shipTypes = data["ship_types"];
        
        document.querySelector("#searchButton").onclick = search;

        setDropdowns();
    };

    getData(infoUrl, initPage);
    getData(shipsUrl, search);
};

function setDropdowns(){
    let nationSelect = document.querySelector("#nation");
    let shipTypeSelect = document.querySelector("#shipType");
    let tierSelect = document.querySelector("#tier");

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
}

function search(){
    let url = shipsUrl;
    /*CHANGE THIS TO GET INFO FROM UI ELEMENT*/pageNum = 1;

    let tier = document.querySelector("#tier").value;
    let nation = document.querySelector("#nation").value;
    let shipType = document.querySelector("#shipType").value;

    if (nation != undefined){
        url += `&nation=${nation}`;
    }
    if (nation != undefined){
        url += `&type=${shipType}`;
    }

    function filterTier(e){
        let data = JSON.parse(e.target.responseText);

        maxPage = data.meta.page_total;
    
        data = data.data;
    
        let filteredData = {};
    
        let filteredValues = Object.values(data).filter((ship) => ship.tier == tier);
    
        for (let i = 0; i < filteredValues.length; i++){
            filteredData[Object.keys(data).find(key => data[key] == filteredValues[i])] = filteredValues[i];
        }
    
        loadShips(filteredData);
    }

    url += `&page_no=${pageNum}`;

    getData(url, filterTier);
}

function getData(url, method = (e) => {loadShips(JSON.parse(e.target.responseText).data)}){
    let xhr = new XMLHttpRequest();

    xhr.onload = method;

    xhr.open("GET", url);
    xhr.send();
}

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
}