
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

function pushLinks(source, targetArr) {
    // TODO refactor Cell to use nbr array insted of asshole map
    // TODO use source and target to generate link id for object constancy
}

function mutatedNextStateGraph(dynamicMode) {
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

            if (dynamicMode) {
                //TODO
            }
        }
    return nextStateGraph;
}

///////////////
// D3 UTILITIES
///////////////
