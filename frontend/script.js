// Initialiser la carte
const initMap = () => {
    // Dimensions de la carte
    const mapContainer = document.getElementById('map');
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight;

    // Supprimer l'ancienne carte SVG si elle existe
    d3.select("#map").selectAll("svg").remove();

    // Créer un élément SVG
    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Ajuster l'échelle de la projection en fonction de la taille de la fenêtre avec des marges
    const margin = 50;
    const scale = Math.min(width - margin * 2, height - margin * 2) * 6.5;

    // Créer une projection
    const projection = d3.geoConicConformal()
        .center([2.454071, 46.279229]) // Centrer la carte sur la France
        .scale(scale)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Fonction pour formater les détails des activités et taxes
    const formatDetails = (details) => {
        return details.map(detail => {
            return `${detail.activity}: ${detail.rate}%`;
        }).join('<br>');
    };

    // Liste des couleurs claires
    const colors = ["#ffcccb", "#ffb6c1", "#ffefd5", "#ffe4e1", "#fafad2", "#e0ffff", "#afeeee", "#db7093", "#dda0dd", "#98fb98", "#ffdab9", "#ffdead", "#f5deb3", "#d8bfd8", "#ff6347", "#f4a460", "#fffacd", "#e6e6fa"];

    // Charger les données GeoJSON
    d3.json("gadm41_FRA_1.json").then(data => {
        // Ajouter la couche GeoJSON à la carte
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
            .on("click", function(event, d) {
                // Zoom sur la région sélectionnée
                const [[x0, y0], [x1, y1]] = path.bounds(d);
                const dx = x1 - x0;
                const dy = y1 - y0;
                const x = (x0 + x1) / 2;
                const y = (y0 + y1) / 2;
                const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];
                
                svg.transition()
                    .duration(750)
                    .call(
                        d3.zoom().transform,
                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                    );

                // Rediriger vers la page de la région après l'animation
                setTimeout(() => {
                    const regionId = data.features.findIndex(feature => feature.properties.NAME_1 === d.properties.NAME_1) + 1;
                    window.location.href = `/region.html?id=${regionId}`;
                }, 750);
            })
            .append("title")
            .text(d => d.properties.NAME_1);

        // Ajouter des labels pour chaque région
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
};

// Initialiser la carte au chargement de la page
initMap();

// Réinitialiser la carte lors du redimensionnement de la fenêtre
window.addEventListener("resize", initMap);

