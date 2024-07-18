// Dimensions of the map
const width = 960;
const height = 800;

// Create an SVG element
const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// Create a projection
const projection = d3.geoConicConformal()
    .center([2.454071, 46.279229]) // Center the map on France
    .scale(4000)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Fonction pour formater les détails des activités et taxes
const formatDetails = (details) => {
    return details.map(detail => {
        return `${detail.activity}: ${detail.tax_name} - ${detail.rate}%`;
    }).join('<br>');
};

// Liste des couleurs claires
const colors = ["#ffcccb", "#ffb6c1", "#ffefd5", "#ffe4e1", "#fafad2", "#e0ffff", "#afeeee", "#db7093", "#dda0dd", "#98fb98", "#ffdab9", "#ffdead", "#f5deb3", "#d8bfd8", "#ff6347", "#f4a460", "#fffacd", "#e6e6fa"];

// Load the GeoJSON data
d3.json("gadm41_FRA_1.json").then(data => {
    // Add GeoJSON layer to the map
    svg.selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "region")
        .style("fill", (d, i) => colors[i % colors.length]) // Assigner une couleur unique à chaque région
        .style("stroke", "#ffffff")
        .style("stroke-width", "1.5")
        .on("mouseover", async function(event, d) {
            d3.select(this).style("fill-opacity", 0.7);
            try {
                const regionId = data.features.findIndex(feature => feature.properties.NAME_1 === d.properties.NAME_1) + 1;
                console.log(`Fetching details for region ID: ${regionId}`);
                const detailsResponse = await fetch(`/regions/${regionId}/details`);
                const details = await detailsResponse.json();
                const formattedDetails = formatDetails(details);
                
                d3.select("#tooltip")
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html(`<strong>${d.properties.NAME_1}</strong><br>${formattedDetails}`)
                    .transition()
                    .duration(200)
                    .style("opacity", .9);
            } catch (error) {
                console.error('Error fetching details:', error);
            }
        })
        .on("mousemove", function(event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("fill-opacity", 1);
            d3.select("#tooltip").transition().duration(500).style("opacity", 0);
        })
        .append("title")
        .text(d => d.properties.NAME_1);

    // Add labels for each region
    svg.selectAll("text")
        .data(data.features)
        .enter().append("text")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .attr("class", "label")
        .text(d => d.properties.NAME_1)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#000");
}).catch(error => console.error('Error loading or parsing data:', error));

// Ajouter l'élément div pour l'infobulle
d3.select("body").append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);
