var viewW = 600    // THIS MUST BE A SUPER NICE NUMBER
    , viewH = 600  // THIS MUST BE A SUPER NICE NUMBER

    , w = viewW / 2 
    , h = viewH / 2

    , cellSize = 10
    , padding = 10

    , ccx = w/(cellSize + padding) // cell count x
    , ccy = h/(cellSize + padding) // cell count y

    , xScale = d3.scale.linear().domain([0, ccx])
                                .range([0, viewW])
    , yScale = d3.scale.linear().domain([0, ccy])
                                .range([0, viewH])

    , delay = 150 // ms between generations

    , density = 0.2 // 1.0 for full moore neighborhoods
    , depth = 3 // max range of moore neighborhood connections

    , stateGraph = []
    , nextStateGraph = []
    , links = []

    , iterating = false
    , mode = 'log'
    ;

// assign initial cell states
// 3 possible cell states - 0, 1, or 2
d3.range(ccx * ccy).forEach(function(c) {
    stateGraph[c] = new Cell(Math.floor(Math.random() * 3), c, stateGraph);
    nextStateGraph[c] = new Cell(0, c, nextStateGraph);

    stateGraph[c].x = nextStateGraph[c].x = xScale(c % ccx);
    stateGraph[c].y = nextStateGraph[c].y = yScale(Math.floor(c / ccx));
});

// set initial neighborhoods
d3.range(ccx * ccy).forEach(function(c) {
    var levelDensity = density; // density quadratically decreases with distance
    for (var i = 1; i <= depth; i++) {
        // generate neighbor coordinates
        var nbrCoords = mooreNbrs(c, i, levelDensity);

        // add coordinates to graph(s)
        stateGraph[c].addNbrs(nbrCoords);
        nextStateGraph[c].addNbrs(nbrCoords);

        // put neighbors in links list for force layout
        stateGraph[c].d3Links.forEach(function (l) {
            links.push(l);
        });

        // quadratically decrease density
        levelDensity *= levelDensity;
    }
});

var force = d3.layout.force()
    .size([viewW, viewH])
    .nodes(stateGraph, function (d) {return d.idx;})
    .links(links)
    .linkDistance(padding)
    .charge(-15)
    .chargeDistance(padding * 30)
    .gravity(0.001)
    .friction(0.8)
    .on('tick', tick)
    .start();

var zoom = d3.behavior.zoom().on("zoom", zoomed);

var drag = force.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged);

var vis = d3.select('.output').append('svg')
    .attr('width', viewW)
    .attr('height', viewH)
    .append('g')
    .call(zoom);

var rect = vis.append("rect")
    .attr("width", viewW)
    .attr("height", viewH)
    .style("fill", "none")
    .style("pointer-events", "all");

var container = vis.append('g');

var link = container.selectAll("line")
    .data(force.links())
    .enter()
        .append("line");

link.classed({'link': true});

var node = container.selectAll('circle')
        .data(force.nodes(), function (d) { return d.idx; })
    .enter().append('circle')
    .attr('r', cellSize)
    .call(drag)
    .on("click", function(d) {
        if (d3.event.shiftKey) {
            d.state = (d.state + 1) % 3;
        }
    });

    // class all cells as .cell
    // map state 0 to rock, 1 to paper, 2 to scissors
node.classed({'cell': true,
              'rock': function(d) { return d.state === 0; },
              'paper': function(d) { return d.state === 1; },
              'scissors': function(d) { return d.state === 2; }});

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function tick() {
    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
}

function iterate() {
    if (iterating) {
        // get next graph of states, true for dynamic mode
        var swap = mutatedNextStateGraph(true);
        // clear link list
        links.length = 0;
        // iterate through state graph node array
        for (var i = 0; i < stateGraph.length; i++) {

            // swap node properties so that object references are constant in d3
            stateGraph[i].state = swap[i].state;
            // triangle swap .nbrs prop because it's an array or something
            var swapNbrs = stateGraph[i].nbrs;
            stateGraph[i].nbrs = swap[i].nbrs;
            swap[i].nbrs = swapNbrs;

            // TODO rebuild link list
            stateGraph[i].d3Links.forEach(function (l) {
                links.push(l);
            });
        }
        
        // update nodes
        // map state 0 to rock, 1 to paper, 2 to scissors
        node.data(stateGraph)
            .classed({'rock': function(d) { return d.state === 0; },
                      'paper': function(d) { return d.state === 1; },
                      'scissors': function(d) { return d.state === 2; }});

        // update links
        console.log(links.length);
        link = link.data(force.links());
        link.enter()
                .append('line').attr('class', 'link');

        link.exit()
                .remove();

        force.start();
    }

    // make sure button state reflects mode
    d3.select('.mode').selectAll('button').each(function () {
        if (this.innerHTML !== mode) this.disabled = false;
        else this.disabled = true;
    });

}

setInterval(iterate, delay);

document.onkeypress = function (e) {
    e = e || window.event;
    if (e.keyCode === 13) {
        iterating = !iterating;
        if (iterating) {
            d3.select('body').style('background-color', '#223322');
        } else {
            d3.select('body').style('background-color', '#332222');
        }
    }
}
document.onkeydown = function (e) {
    e = e || window.event;
    if (e.shiftKey) {
        //node.on('mousedown.drag', null);
    }
}
document.onkeyup = function (e) {
    e = e || window.event;
    if (e.shiftKey) {
        //node.call(force.drag);
    }
}
