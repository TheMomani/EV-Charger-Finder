//
const mainForm = document.getElementById("mainForm")
const submitForm = document.getElementById("submitForm")
const cityInput = document.getElementById("cityInput")
const cityAPIKey = '756e8421dfmsh739af9a55e4688ep138a2cjsn9917579d7c79';
const errorTXT = document.getElementById("errorTXT")
const countrySelect = document.getElementById("countrySelect");
const countryCode = ""
const cityName = ""
const evDropdown = document.getElementById('evModelSelect');
let connector = ""
const markers = [];  // Store all current markers
errorTXT.innerText = "";

//map
const map = L.map('map').setView([43.2569, -79.9010],13);
// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add a marker
L.marker([0,0]).addTo(map)
  .bindPopup('')
  .openPopup();

//dictionary 
const connectorAliases = {
  // CCS (Combined Charging System)
  "CCS": [
    "CCS",
    "CCS Type 1",
    "CCS Type 2",
    "CCS1",
    "CCS2",
    "CCS (Type 1)",
    "CCS (Type 2)",
    "IEC 62196-3 Configuration FF",
    "Combo 1",
    "Combo 2",
    "SAE Combo",
    "SAE J1772 Combo",
    "SAE J1772 Combo 1",
    "SAE J1772 Combo 2"
  ],

  // CHAdeMO
  "CHAdeMO": [
    "CHAdeMO",
    "CHAdeMO Charger",
    "IEC 62196-3 Configuration AA",
    "Japan CHAdeMO",
    "CHAdeMO Fast Charger"
  ],

  // J1772 (AC Level 2, North America)
  "J1772": [
    "J1772",
    "Type 1",
    "Type 1 (J1772)",
    "SAE J1772",
    "SAE J1772 Level 2",
    "J1772 AC",
    "Type 1 AC",
    "J1772-2009",
    "J1772 AC Level 2",
    "Level 2 J1772"
  ],

  // Type 2 (AC Level 2, Europe and other regions)
  "Type 2": [
    "Type 2",
    "Type 2 (Tethered Connector)",
    "IEC 62196-2",
    "Mennekes",
    "Type 2 Mennekes",
    "Type 2 AC",
    "Type 2 Socket",
    "Type 2 Plug",
    "IEC Type 2",
    "Type 2 CCS",
    "Mode 3 Type 2"
  ],

  // Tesla (proprietary and CCS variants)
  "Tesla": [
    "Tesla",
    "Tesla Connector",
    "Tesla Supercharger",
    "Tesla Proprietary",
    "Tesla Model S Connector",
    "Tesla Model 3 Connector",
    "Tesla Model X Connector",
    "Tesla Model Y Connector",
    "Tesla Type 2",
    "Tesla CCS",
    "Tesla North America Connector",
    "Tesla EU Connector"
  ],

  // GB/T (China)
  "GB/T": [
    "GB/T",
    "GBT",
    "China GB/T",
    "GB/T AC",
    "GB/T DC",
    "Chinese Standard GB/T",
    "GB/T 20234",
    "GB/T 27930",
    "GB/T AC Type",
    "GB/T DC Type"
  ],

  // Other less common or legacy connectors
  "Type 3": [
    "Type 3",
    "Type 3A",
    "Type 3C",
    "Scame",
    "Type 3 AC"
  ],

  "Mennekes": [
    "Mennekes",
    "IEC 62196-2",
    "Type 2 Mennekes"
  ],

  "Tesla CHAdeMO Adapter": [
    "Tesla CHAdeMO Adapter",
    "Tesla to CHAdeMO Adapter",
    "Tesla CHAdeMO"
  ],

  "Tesla CCS Adapter": [
    "Tesla CCS Adapter",
    "Tesla to CCS Adapter",
    "Tesla CCS"
  ]
};

//after fetching chargers nearby, filters to show only compatible ones
function compatibleCharger(dictionary, userInput, stations) {
  if (!userInput) return [];

  const typesArray = (dictionary[userInput] || []).map(t => t.toLowerCase().trim());

  let compatibleStations = stations.filter(station =>
    station.connections.some(conn => {
      const typeName = (conn.type_name || "").toLowerCase().trim();
      const typeOfficial = (conn.type_official || "").toLowerCase().trim();
      return typesArray.includes(typeName) || typesArray.includes(typeOfficial);
    })
  );

  if (compatibleStations.length === 0) {
    errorTXT.innerText = "No compatible stations found! Bring an adapter.";
    return [];
  } else {
    errorTXT.innerText = "";
  }

  console.log(compatibleStations);
  return compatibleStations;
}



evDropdown.addEventListener('change', () => {
  const selectedOption = evDropdown.options[evDropdown.selectedIndex];
  connector = selectedOption.value
  
});
console.log(connector)
async function fetchEV() {
    
    try {
        const response = await fetch(`https://api.api-ninjas.com/v1/electricvehicle?make=volkswagen`, {
            headers: {
                "X-Api-Key" : 'v+p6FPiLgbSmziKNT0iN8Q==FYQqiUlhwhYRq68k'


            }
        });

        const EVJson = await response.json();
        console.log(EVJson)
    } catch (error) {
        throw new Error("Could not fetch EVs")
    }
    

}

//uses longitude and latitude of city to find nearby chargers
async function fetchCharger(latitude,longitude) {

    try {
        const response = await fetch(`https://api.api-ninjas.com/v1/evcharger?lat=${latitude}&lon=${longitude}&level=3`, {
            headers: {
                "X-Api-Key" : 'v+p6FPiLgbSmziKNT0iN8Q==FYQqiUlhwhYRq68k'


            }
        });

        const chargerJson = await response.json();
        console.log(chargerJson)
        if(!response.ok){
            throw new Error("Cannot fetch API!")
        }
        if(chargerJson.length===0){
            throw new Error("Area has no chargers!")
        }
        return chargerJson
     } catch (error) {
      throw error
     }
    //     errorTXT.innerText = error.message;
    // }
}

// Function to find latitude and longitude of inputted city
async function fetchCityCoords(cityName, countryCode){
    try {

        errorTXT.innerText = ""
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${cityName}&types=CITY&countryIds=${countryCode}`, {
        headers: {
            'X-RapidAPI-Key': cityAPIKey,
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
        })
        if(!response.ok) {
            throw new Error("Could not fetch coordinates")
        };
        var cityJson = await response.json()
        console.log(cityJson);

        if(cityJson.data.length === 0){
            throw new Error("Invalid city in chosen country!")
        };
        const {
            data: [{latitude, longitude}]
        } = cityJson

        return [latitude,longitude]
        
    } catch (error){
      throw error
    }
        // errorTXT.innerText = error.message;
        // return null;
    
}

// The submit button
submitForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const cityName = cityInput.value;
      if(cityName.length===0){
        throw new Error("Input a city name!")
      }
      if(connector==""){
        throw new Error("Choose an EV!")
      }

      const countryCode = countrySelect.value;
      console.log(`${cityName},${countryCode}`);

      const coordinates = await fetchCityCoords(cityName, countryCode);


      const nearStations = await fetchCharger(coordinates[0], coordinates[1]);


      const matchedStations = compatibleCharger(connectorAliases, connector, nearStations);

      // Center map on the new city
      map.setView(coordinates, 10);

      // Clear previous markers
      markers.forEach(marker => map.removeLayer(marker));
      markers.length = 0;

      // new markers
      matchedStations.forEach(station => {
          const { latitude, longitude, name, address } = station;

          const popupText = `
              <b>${name || "Unnamed Station"}</b><br>
              ${address || ""}<br>
              <a href="https://www.google.com/maps?q=${latitude},${longitude}"target="_blank" rel="noopener noreferrer">
              <button class="mapBtn rounded-3">Open in Maps</button>
              </a>
          `;

          const marker = L.marker([latitude, longitude])
              .addTo(map)
              .bindPopup(popupText);

          markers.push(marker); // 👈 Track marker
    });
    } catch (error) {
      errorTXT.innerText = error.message
    }
    
});




