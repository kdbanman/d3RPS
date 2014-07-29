var w   = 200 // bl.ocks.org viewport width
  , h   = 200 // bl.ocks.org viewport height

  , cw  = 5 // cellWidth
  , ch  = 5 // cellHeight

  , ccx = w/cw // cell count x
  , ccy = h/ch // cell count y
  , delay = 10  // ms between generations
  , xScale  = d3.scale.linear().domain([0, ccx]).rangeRound([0, ccx * cw])
  , yScale  = d3.scale.linear().domain([0, ccy]).rangeRound([0, ccy * ch])

  , density = 1.0 // 1.0 for full moore neighborhoods
  , depth = 1 // max range of moore neighborhood connections

  , stateGraph = []
  ;

function coord(x, y) {
  return coord[x +','+ y] ||
        (coord[x +','+ y] = ccx * ((ccy + y) % ccy) + ((ccx + x) % ccx));
}

// returns an array of coordinates (array indices) for stateGraph
// TODO make this return an array of coordinates - the getter will be a Cell prop
// TODO use depth and density controls
function setMooreNbrs(graph, c, dist) {
  dist = dist || 1;

  // attempt to get memoized coordinate array
  if (setMooreNbrs[c + ',' + dist] === undefined) {
    // generate memoized entry
    setMooreNbrs[c + ',' + dist] = [];
    var x = c % ccx;
    var y = Math.floor(c / ccx);

    // start from top left and push to nbr array clockwise
    var nbrX = x - dist;
    var nbrY = y - dist;
    while (nbrX <= x + dist) {
      setMooreNbrs[c + ',' + dist].push(coord(nbrX,nbrY));
      nbrX++;
    } // top row pushed
    nbrX--;
    nbrY++;
    while (nbrY <= y + dist) {
      setMooreNbrs[c + ',' + dist].push(coord(nbrX,nbrY));
      nbrY++;
    } // right col pushed
    nbrY--;
    nbrX--;
    while (nbrX >= x - dist) {
      setMooreNbrs[c + ',' + dist].push(coord(nbrX,nbrY));
      nbrX--;
    } // bottom row pushed
    nbrX++;
    nbrY--;
    while (nbrY > y - dist) {
      setMooreNbrs[c + ',' + dist].push(coord(nbrX,nbrY));
      nbrY--;
    }
  }

  graph[c].__defineGetter__("nbrs", function () {
    var coordArr = setMooreNbrs[c + ',' + dist];
    var nbrArr = [];
    coordArr.forEach( function (c) {
      nbrArr.push(graph[c]);
    });
    return nbrArr;
  });
}

// assign initial cell states
// 3 possible cell states - 0, 1, or 2
// TODO probably have to initialize and maintain a links object for updateness
d3.range(ccx * ccy).forEach(function(c) {
  stateGraph[c] = {state: Math.floor(Math.random() * 3)};
  stateGraph[c].nbrs = setMooreNbrs(stateGraph, c);
});

var vis = d3.select('body').append('svg:svg')
    .attr('width', w)
    .attr('height', h);

vis.selectAll('rect')
    .data(stateGraph)
  .enter().append('svg:rect')
  .attr('width', cw)
  .attr('height', ch)
  .attr('x', function(d, i) { return xScale(i % ccx); })
  .attr('y', function(d, i) { return yScale(i / ccx | 0); })
  // class all cells as .cell
  // map state 0 to rock, 1 to paper, 2 to scissors
  .classed({'cell': true,
            'rock': function(d) { return d.state === 0; },
            'paper': function(d) { return d.state === 1; },
            'scissors': function(d) { return d.state === 2; }});

function createNewGeneration() {
  var c,
      numRock,
      numPaper,
      numScissors,
      nextStateGraph = [];
  for (c = 0; c < stateGraph.length; c++) {
      numRock = 0;
      numPaper = 0;
      numScissors = 0;
      stateGraph[c].nbrs.forEach(function (cell) {
        if (cell.state === 0) numRock++;
        else if (cell.state === 1) numPaper++;
        else numScissors++;
      });

      nextStateGraph.push({});
      nextStateGraph[c].nbrs = setMooreNbrs(nextStateGraph, c);

      if (stateGraph[c].state === 0 && numPaper > numRock)
        nextStateGraph[c].state = 1;
      else if (stateGraph[c].state === 1 && numScissors > numPaper)
        nextStateGraph[c].state = 2;
      else if (stateGraph[c].state === 2 && numRock > numScissors)
        nextStateGraph[c].state = 0;
      else 
        nextStateGraph[c].state = stateGraph[c].state;

    }
  return nextStateGraph;
}

function animate() {
  d3.selectAll('rect')
    .data(stateGraph = createNewGeneration())
  // class all cells as .cell
  // map state 0 to rock, 1 to paper, 2 to scissors
  .classed({'cell': true,
            'rock': function(d) { return d.state === 0; },
            'paper': function(d) { return d.state === 1; },
            'scissors': function(d) { return d.state === 2; }});

  return false;
}

setInterval(animate, delay);
