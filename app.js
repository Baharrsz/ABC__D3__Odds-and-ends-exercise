d3.queue()
    .defer(d3.csv,'./data/co2/API_EN.ATM.CO2E.KT_DS2_en_csv_v2.csv', formatter)
    .defer(d3.csv,'./data/methane/API_EN.ATM.METH.KT.CE_DS2_en_csv_v2.csv', formatter)
    .defer(d3.csv,'./data/population/API_SP.POP.TOTL_DS2_en_csv_v2.csv', formatter)
    .defer(d3.csv,'./data/renewable/API_EG.FEC.RNEW.ZS_DS2_en_csv_v2.csv', formatter)
    .defer(d3.csv,'./data/urban_population/API_SP.URB.TOTL_DS2_en_csv_v2.csv', formatter)
    .awaitAll((error, data) => {
        if (error) console.log(error);
        let formattedData = formatAllData(data);
        let years = Object.keys(formattedData);
        let initialYear = d3.min(years)
        let plotSizes = {height: 700, width: 700, padding: 100}
        setPlot(plotSizes)
        drawPlot(formattedData, initialYear, plotSizes);
        pickYearAndPlot(formattedData, plotSizes)
        tooltip();
    })
    

function formatter(row, i, headers) {
     var invalidRows = [
    'Arab World', 
    'Central Europe and the Baltics',
    'Caribbean small states',
    'East Asia & Pacific (excluding high income)',
    'Early-demographic dividend',
    'East Asia & Pacific',
    'Europe & Central Asia (excluding high income)',
    'Europe & Central Asia',
    'Euro area',
    'European Union',
    'Fragile and conflict affected situations',
    'High income',
    'Heavily indebted poor countries (HIPC)',
    'IBRD only',
    'IDA & IBRD total',
    'IDA total',
    'IDA blend',
    'IDA only',
    'Not classified',
    'Latin America & Caribbean (excluding high income)',
    'Latin America & Caribbean',
    'Least developed countries: UN classification',
    'Low income',
    'Lower middle income',
    'Low & middle income',
    'Late-demographic dividend',
    'Middle East & North Africa',
    'Middle income',
    'Middle East & North Africa (excluding high income)',
    'North America',
    'OECD members',
    'Other small states',
    'Pre-demographic dividend',
    'Pacific island small states',
    'Post-demographic dividend',
    'Sub-Saharan Africa (excluding high income)',
    'Sub-Saharan Africa',
    'Small states',
    'East Asia & Pacific (IDA & IBRD countries)',
    'Europe & Central Asia (IDA & IBRD countries)',
    'Latin America & the Caribbean (IDA & IBRD countries)',
    'Middle East & North Africa (IDA & IBRD countries)',
    'South Asia (IDA & IBRD)',
    'Sub-Saharan Africa (IDA & IBRD countries)',
    'Upper middle income',
    'World'
  ];
  if (invalidRows.indexOf(row['Country Name']) > -1) return;
  let result = {
      country: row['Country Name'], 
      indicator: row['Indicator Name']}
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
        let indicator = indArr[0].indicator.split(' ')[0].replace(',','').toLowerCase();

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

function setPlot(plotSizes) {
    //Setting the SVG
    const {height, width, padding} = plotSizes;
    let svg = d3.select('svg')
                    .attr('height', height)
                    .attr('width', width)

    svg
    .append('g')
        .classed('circles', true)


    //Setting the Axes
    svg
    .append('g')
        .classed('xAxis', true)
        .attr('transform', `translate(0, ${height- padding / 2})`)

    svg
    .append('g')
        .classed('yAxis', true)
        .attr('transform', `translate(${padding / 2},0)`)


    //Axes labels
    svg
    .append('text')
        .classed('.axis-label', true)
        .text('Methane Emissions (kt of CO2 equivalent per person)')
        .attr('x', width / 2)
        .attr('y', height - padding / 8)
        .attr('text-anchor', 'middle')

    svg
    .append('text')
        .classed('.axis-label', true)
        .text('CO2 Emissions (kt per person)')
        .attr('x', padding / 8)
        .attr('y', (height) / 2)
        .attr('transform', `rotate(-90 ${padding / 8},${height / 2})`)
        .attr('text-anchor', 'middle')

    //Plot title
    svg
    .append('text')
        .classed('plotTitle', true)
        .attr('x', width / 2)
        .attr('y', padding / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', 'x-large')

    return {height, width, padding};
}

function drawPlot(data, year, plotSizes) {
    const {height, width, padding} = plotSizes;

    data = data[year];

    //Creatign scales
    let xRange = d3.extent(data, d => d.methane / d.population);
    let xScale = d3.scaleLinear()
                    .domain(xRange)
                    .range([padding, width - padding]);

    let yRange = d3.extent(data, d => d.co2 / d.population);
    let yScale = d3.scaleLinear()
                    .domain(yRange)
                    .range([height - padding, padding]);

    let rScale = d3.scaleLinear()
                    .domain([0,100])
                    .range([5, 30]);

    let clrScale = d3.scaleLinear()
                        .domain([0,100])
                        .range(['black', 'green']);


    //Drawing circles
    let update = d3.select('svg')
                    .select('.circles')
                    .selectAll('circle')
                        .data(data);
    
    update
        .exit()
        .transition()
            .duration(1000)
            .attr('r', 0)
        .remove();
    
    update
        .enter()
        .append('circle')
        //The duplication here (the 2 lines below and after transition()) is so that for the first plot
        //transition only happens for the radius and the circles don't drop from out of space into the plot.
            .attr('cx', d => xScale(d.methane / d.population))
            .attr('cy', d => yScale(d.co2 / d.population))
        .merge(update)
            .classed('circle', true)
        .transition()
            .duration(1000)
            .attr('cx', d => xScale(d.methane / d.population))
            .attr('cy', d => yScale(d.co2 / d.population))
            .attr('r', d => rScale(d.urban / d.population * 100))
            .attr('fill', d => clrScale(d.renewable))
            .attr('stroke', 'grey');


    //Axes
    let xAxis = d3.axisBottom(xScale)
                    .tickSize(-(height - 3 / 2 * padding))
                    .tickSizeOuter(0)
    d3.select('.xAxis')
        .call(xAxis)

    let yAxis = d3.axisLeft(yScale)  
                    .tickSize(-(width - 3 / 2 * padding))
                    .tickSizeOuter(0)        
    d3.select('.yAxis')
        .call(yAxis)

    //Plot title
    d3.select('svg')
    .select('.plotTitle')
        .text(`CO2 vs Methane Emissions for the year ${year}`)
}

function tooltip() {
var tooltip = d3.select('body')
				.append('div')
					.classed('tooltip', true)

    d3.selectAll('.circle')
        .on('mousemove', showTooltip)
        .on('touchstart', showTooltip)
        .on('mouseout', hideTooltip)
        .on('touchend', hideTooltip)
}

function showTooltip(d){
    let event = d3.event;
    let tooltip = d3.select('.tooltip')
    tooltip
        .style('opacity', 1)
        .style('left', `${event.x - tooltip.node().offsetWidth / 2}px`)
        .style('top', `${event.y}px`)
        .html(`
            <p style="font-weight:bold">${d.country}</p>
            <p>Popultaion: ${d.population / 1E6} million</p>
            <p>Urban Population: ${d3.format(".2f")(d.urban / d.population * 100)}%</p>
            <p>Renewable Energy: ${d3.format(".2f")(d.renewable)}%</p>
            <p>Methane Emissionn: ${d3.format(".3f")(d.methane / d.population)}</p>
            <p>CO2 Emission: ${d3.format(".3f")(d.co2 / d.population)}</p>
        `)
}

function hideTooltip(d) {
    d3.select('.tooltip')
        .style('opacity', 0)
}

function pickYearAndPlot(data, plotSizes){
    let years = Object.keys(data);
    let input = d3.select('input')
    input
        .property('min', 0)
        .property('max', years.length - 1)
        .on('change', () => {
            let year = years[input.property('value')];
            d3.select(".picker__selected")
                .text(year)
            drawPlot(data, year, plotSizes)
        })
}