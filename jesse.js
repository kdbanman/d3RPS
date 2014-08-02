var w   = 1000 // bl.ocks.org viewport width
  , h   = 500 // bl.ocks.org viewport height

  , cw  = 1 // cellWidth
  , ch  = 1 // cellHeight

  , ccx = w/cw // cell count x
  , ccy = h/ch // cell count y
  , delay = 100  // ms between generations
  , xScale  = d3.scale.linear().domain([0, ccx]).rangeRound([0, ccx * cw])
  , yScale  = d3.scale.linear().domain([0, ccy]).rangeRound([0, ccy * ch])

  , states = []
  , mode = 'identity'
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

d3.range(ccx * ccy).forEach(function(c) {
  // 3 possible cell states - 0, 1, or 2
  states[c] = Math.floor(Math.random() * 3);
});

var vis = d3.select('body').append('svg:svg')
    .attr('width', w)
    .attr('height', h);

vis.selectAll('rect')
    .data(states)
  .enter().append('svg:rect')
  .attr('width', cw)
  .attr('height', ch)
  .attr('x', function(d, i) { return xScale(i % ccx); })
  .attr('y', function(d, i) { return yScale(i / ccx | 0); })
  // class all cells as .cell
  // map state 0 to rock, 1 to paper, 2 to scissors
  .classed({'cell': true,
            'rock': function(d) { return d === 0; },
            'paper': function(d) { return d === 1; },
            'scissors': function(d) { return d === 2; }});

function createNewGeneration() {
  var x,
      y,
      t,
      r,
      b,
      l,
      nbrs,
      numRock = 0,
      numPaper = 0,
      numScissors = 0,
      nextState = [];
  for (x = 0; x < ccx; x++) {
    l = x - 1;
    r = x + 1;
    for (y = 0; y < ccy; y++) {
      t = y - 1;
      b = y + 1;
      nbrs = [states[coord(l,t)], states[coord(x,t)], states[coord(r,t)],
              states[coord(l,y)],                     states[coord(r,y)],
              states[coord(l,b)], states[coord(x,b)], states[coord(r,b)]];

      numRock = 0;
      numPaper = 0;
      numScissors = 0;
      nbrs.forEach(function (state) {
        if (state === 0) numRock++;
        else if (state === 1) numPaper++;
        else numScissors++;
      });

      if (states[coord(x,y)] === 0 && numPaper > competition[mode](numRock))
        nextState[coord(x,y)] = 1;
      else if (states[coord(x,y)] === 1 && numScissors > competition[mode](numPaper))
        nextState[coord(x,y)] = 2;
      else if (states[coord(x,y)] === 2 && numRock > competition[mode](numScissors))
        nextState[coord(x,y)] = 0;
      else 
        nextState[coord(x,y)] = states[coord(x,y)];
    }
  }
  return nextState;
}

function coord(x, y) {
  return coord[x +','+ y] ||
        (coord[x +','+ y] = ccx * ((ccy + y) % ccy) + ((ccx + x) % ccx));
}

function animate() {
  d3.selectAll('rect')
    .data(states = createNewGeneration())
  // class all cells as .cell
  // map state 0 to rock, 1 to paper, 2 to scissors
  .classed({'rock': function(d) { return d === 0; },
            'paper': function(d) { return d === 1; },
            'scissors': function(d) { return d === 2; }});

  return false;
}

setInterval(animate, delay);
