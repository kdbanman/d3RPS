var viewW = 800    // THIS MUST BE A SUPER NICE NUMBER
    , viewH = 800  // THIS MUST BE A SUPER NICE NUMBER

    , w = viewW / 2 
    , h = viewW / 2

    , cellSize = 10 // cellWidth
    , padding = 10

    , ccx = w/(cellSize + padding) // cell count x
    , ccy = h/(cellSize + padding) // cell count y

    , xScale = d3.scale.linear().domain([0, ccx])
                                .range([0, ccx * (cellSize + padding)])
    , yScale = d3.scale.linear().domain([0, ccy])
                                .range([0, ccy * (cellSize + padding)])

    , delay = 50 // ms between generations

    , density = 0.3 // 1.0 for full moore neighborhoods
    , depth = 2 // max range of moore neighborhood connections

    , stateGraph = []
    , nextStateGraph = []
    , links = []

    , iterating = false
    , mode = 'log'
    ;

var competition = {
	zero: function (defender) {
		return 0;
	},
	identity: function (defender) {
		return defender;
	},
	half: function (defender) {
		return defender / 2;
	},
	sqrt: function (defender) {
		return Math.sqrt(defender);
	},
	log: function (defender) {
		return Math.log(defender) / Math.log(2);
	}
}

function coord(x, y) {
    return coord[x +','+ y] ||
           (coord[x +','+ y] = ccx * ((ccy + y) % ccy) + ((ccx + x) % ccx));
}

// returns an array of coordinates (array indices) for stateGraph
function mooreNbrs(c, dist, density) {
    dist = dist || 1;


    // attempt to get memoized coordinate array
    if (mooreNbrs[c + ',' + dist] === undefined) {

        if (c % 1 !== 0) console.log('c must be integer');
        if (dist % 1 !== 0) console.log('dist must be integer');

        // generate memoized entry
        mooreNbrs[c + ',' + dist] = [];

        var pushNbr = function (pushX, pushY) {
            if (pushX >= 0 && pushX < ccx &&
                pushY >= 0 && pushY < ccy &&
                Math.random() < density)
                mooreNbrs[c + ',' + dist].push(coord(pushX,pushY));
        };

        var x = c % ccx;
        var y = Math.floor(c / ccx);

        // start from top left and push to nbr array clockwise
        var nbrX = x - dist;
        var nbrY = y - dist;
        while (nbrX <= x + dist) {
            pushNbr(nbrX, nbrY);
            nbrX++;
        } // top row pushed
        nbrX--;
        nbrY++;
        while (nbrY <= y + dist) {
            pushNbr(nbrX, nbrY);
            nbrY++;
        } // right col pushed
        nbrY--;
        nbrX--;
        while (nbrX >= x - dist) {
            pushNbr(nbrX, nbrY);
            nbrX--;
        } // bottom row pushed
        nbrX++;
        nbrY--;
        while (nbrY > y - dist) {
            pushNbr(nbrX, nbrY);
            nbrY--;
        }
    }

    return mooreNbrs[c + ',' + dist];
}

function mutatedNextStateGraph() {
    var c,
        coord,
        nbr,
        numRock,
        numPaper,
        numScissors;

    for (c = 0; c < stateGraph.length; c++) {
            numRock = 0;
            numPaper = 0;
            numScissors = 0;
            for (coord in stateGraph[c].nbrs) {
                if (stateGraph[coord].state === 0) numRock++;
                else if (stateGraph[coord].state === 1) numPaper++;
                else numScissors++;
            }

            if (stateGraph[c].state === 0 && numPaper > competition[mode](numRock))
                nextStateGraph[c].state = 1;
            else if (stateGraph[c].state === 1 && numScissors > competition[mode](numPaper))
                nextStateGraph[c].state = 2;
            else if (stateGraph[c].state === 2 && numRock > competition[mode](numScissors))
                nextStateGraph[c].state = 0;
            else 
                nextStateGraph[c].state = stateGraph[c].state;

        }
    return nextStateGraph;
}

// assign initial cell states
// 3 possible cell states - 0, 1, or 2
d3.range(ccx * ccy).forEach(function(c) {
    stateGraph[c] = new Cell(Math.floor(Math.random() * 3), c, stateGraph);
    nextStateGraph[c] = new Cell(0, c, nextStateGraph);
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
        nbrCoords.forEach(function (coord) {
            links.push({source: c, target: coord});
        });

        // quadratically decrease density
        levelDensity *= levelDensity;
    }
});

var force = d3.layout.force()
    .size([viewW, viewH])
    .nodes(stateGraph)
    .links(links)
    .linkDistance(padding / 10)
    .charge(-50)
    .on('tick', tick)
    .start();;

var vis = d3.select('.output').append('svg')
    .attr('width', viewW)
    .attr('height', viewH);

var link = vis.selectAll("line")
    .data(force.links())
    .enter().append("line");

link.classed({'link': true,});

var node = vis.selectAll('circle')
        .data(force.nodes(), function (d) { return d.idx; })
    .enter().append('circle')
    .attr('r', cellSize)
    .call(force.drag)
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

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

function iterate() {
    if (iterating) {
        var swap = mutatedNextStateGraph();
        for (var i = 0; i < stateGraph.length; i++) {
            stateGraph[i].state = swap[i].state;

            var swapNbrs = stateGraph[i].nbrs;
            stateGraph[i].nbrs = swap[i].nbrs;
            swap[i].nbrs = swapNbrs;
        }
    }

        node.data(stateGraph)
        // class all cells as .cell
        // map state 0 to rock, 1 to paper, 2 to scissors
        .classed({'rock': function(d) { return d.state === 0; },
                  'paper': function(d) { return d.state === 1; },
                  'scissors': function(d) { return d.state === 2; }});
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
