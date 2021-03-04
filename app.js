d3.queue()
    .defer(d3.csv,"./data/co2/API_EN.ATM.CO2E.KT_DS2_en_csv_v2.csv", formatter)
    .defer(d3.csv,"./data/methane/API_EN.ATM.METH.KT.CE_DS2_en_csv_v2.csv", formatter)
    .defer(d3.csv,"./data/population/API_SP.POP.TOTL_DS2_en_csv_v2.csv", formatter)
    .defer(d3.csv,"./data/renewable/API_EG.FEC.RNEW.ZS_DS2_en_csv_v2.csv", formatter)
    .defer(d3.csv,"./data/urban_population/API_SP.URB.TOTL_DS2_en_csv_v2.csv", formatter)
    .awaitAll((error, data) => {
        if (error) console.log(error);
        let formattedData = formatAllData(data);
        console.log("All years", formattedData)
        let yearData = formattedData[1990];
        drawPlot(yearData)
    })
    

function formatter(row, i, headers) {
     var invalidRows = [
    "Arab World", 
    "Central Europe and the Baltics",
    "Caribbean small states",
    "East Asia & Pacific (excluding high income)",
    "Early-demographic dividend",
    "East Asia & Pacific",
    "Europe & Central Asia (excluding high income)",
    "Europe & Central Asia",
    "Euro area",
    "European Union",
    "Fragile and conflict affected situations",
    "High income",
    "Heavily indebted poor countries (HIPC)",
    "IBRD only",
    "IDA & IBRD total",
    "IDA total",
    "IDA blend",
    "IDA only",
    "Not classified",
    "Latin America & Caribbean (excluding high income)",
    "Latin America & Caribbean",
    "Least developed countries: UN classification",
    "Low income",
    "Lower middle income",
    "Low & middle income",
    "Late-demographic dividend",
    "Middle East & North Africa",
    "Middle income",
    "Middle East & North Africa (excluding high income)",
    "North America",
    "OECD members",
    "Other small states",
    "Pre-demographic dividend",
    "Pacific island small states",
    "Post-demographic dividend",
    "Sub-Saharan Africa (excluding high income)",
    "Sub-Saharan Africa",
    "Small states",
    "East Asia & Pacific (IDA & IBRD countries)",
    "Europe & Central Asia (IDA & IBRD countries)",
    "Latin America & the Caribbean (IDA & IBRD countries)",
    "Middle East & North Africa (IDA & IBRD countries)",
    "South Asia (IDA & IBRD)",
    "Sub-Saharan Africa (IDA & IBRD countries)",
    "Upper middle income",
    "World"
  ];
  if (invalidRows.indexOf(row["Country Name"]) > -1) return;
  let result = {
      country: row["Country Name"], 
      indicator: row["Indicator Name"]}
  headers.forEach(key => {
      if (parseInt(key)) result[key] = +row[key]  || null;
  })
  return result;
}

function formatAllData(data) {
    let resultObj = {};
    //indArr is an array for each indicator [{country, indicator, 1960, 1961, ...}]
    data.forEach((indArr,idx) => {
        //Getting the indicator
        let indicator = indArr[0].indicator.split(" ")[0].replace(",","").toLowerCase();

        //country is an object in each indArr {country, indicator, 1960, 1961, ...}
        indArr.forEach(country => {
            for (let key in country) {
                if (parseInt(key)) {
                    //resultObj should be populated with arrays corresponding to yeaers
                    if (!resultObj[key]) resultObj[key] = [];

                    //For the firs indArr (idx = 0) arrays in resultObj are empty;
                    //They should be populated with objects for each country
                    if (idx === 0){
                        let countryObj = {};
                        countryObj.country = country.country;
                        countryObj[indicator] = country[key];
                        resultObj[key].push(countryObj)
                    } 
                    else{   //For next indArr (idx!=0) country objects exist; 
                            //Only the new indicator key and value must be added.
                        resultObj[key].forEach(c => {
                            if (c.country === country.country) {c[indicator] = country[key];}
                        })
                    }
                }
            }
        })
    })
    for (let year in resultObj) {
        //Deleting countries that don't have population for a year
        resultObj[year] = resultObj[year].filter(country => country.population);

        //Deleting years that don't have complete data for any country
        let indicators = Object.keys(resultObj[year][0]);
        let filtered = resultObj[year].filter(country => {
            // indicators.every(indicator => country[indicator])
            for (indicator of indicators) {
                if (!country[indicator]) return false;
            }
            return true;
        })
        if (filtered.length === 0) delete resultObj[year]

    }

   
    return resultObj;
}

function drawPlot(data) {
    //Setting the SVG
    const height = 600;
    const width = 600;
    const padding = 25;

    let svg = d3.select("svg")
                    .attr("height", height)
                    .attr("width", width)
                    .style("border", "solid black 1px")

    console.log(data)

    //Creatign scales
    let xRange = d3.extent(data, d => d.methane / d.population);
    let xScale = d3.scaleLinear()
                    .domain(xRange)
                    .range([padding, width - 2 * padding]);

    let yRange = d3.extent(data, d => d.co2 / d.population);
    let yScale = d3.scaleLinear()
                    .domain(yRange)
                    .range([height - 2 * padding, padding]);

    let rScale = d3.scaleLinear()
                    .domain([0,100])
                    .range([5, 30]);

    let clrScale = d3.scaleLinear()
                        .domain([0,1])
                        .range(["black", "lime"]);


    
}

