
/////////////////////
// AUTOMATA UTILITIES
/////////////////////

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
            if (defender === 0) return 0;
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

function mutatedNextStateGraph(dynamicMode) {
    var c,
        d1Coord,  // distance 1 nbr coord
        d2Coord,  // distance 2
        d3Coord,  // distance 3
        nbr,
        numRock,
        numPaper,
        numScissors;

    for (c = 0; c < stateGraph.length; c++) {
            numRock = 0;
            numPaper = 0;
            numScissors = 0;
            for (d1Coord in stateGraph[c].nbrs) {
                if (stateGraph[d1Coord].state === 0) numRock++;
                else if (stateGraph[d1Coord].state === 1) numPaper++;
                else numScissors++;
            }

            if (stateGraph[c].state === 0 &&
                numPaper > competition[mode](numRock))
            {
                // paper propagates to ex-rock
                nextStateGraph[c].state = 1;

                if (dynamicMode) {
                    // join rock neighboring neighbors that also neighbor paper
                    for (d1Coord in stateGraph[c].nbrs) {
                        for (d2Coord in stateGraph[d1Coord].nbrs) {
                            //DEBUG
                            if (Math.random() < 0.05)
                                nextStateGraph[c].addNbr(d2Coord);
                            /*
                            // for each node at distance 2, check if rock
                            if (stateGraph[d2Coord].state === 0) {
                                // check if that rock neighbors paper
                                for (d3Coord in stateGraph[d2Coord].nbrs){
                                    if (stateGraph[d3Coord].state === 1) {
                                        // add as nbr if so
                                        nextStateGraph[c].addNbr(d2Coord);
                                    }
                                }
                            }
                            */
                        }
                    }
                }
            } else if (stateGraph[c].state === 1 &&
                numScissors > competition[mode](numPaper))
            {
                // ex-paper becomes scissors
                nextStateGraph[c].state = 2;

                if (dynamicMode) {
                    // sever from neighboring papers that neihbor scissors
                    for (d1Coord in stateGraph[c].nbrs) {
                        for (d2Coord in stateGraph[d1Coord].nbrs) {
                            //DEBUG
                            if (Math.random() < 0.05)
                                nextStateGraph[c].delNbr(d1Coord);
                        }
                    }
                }
            } else if (stateGraph[c].state === 2 &&
                numRock > competition[mode](numScissors))
            {
                // rock propagates to ex-scissors
                nextStateGraph[c].state = 0;
            } else
            {
                // state is maintained
                nextStateGraph[c].state = stateGraph[c].state;
            }
        }
    return nextStateGraph;
}

function linkID(d) {
    return d.source + "-" + d.target;
}
