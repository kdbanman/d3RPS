// basic semi-dynamic* graph library that maintains internal consistency with
// node-level controls.
//   * nodes do not change, but edges may be created/destroyed between them

var Cell = function (initialState, index, parentGraph)
{
    this.state = initialState;
    this.idx = index; // index (or key) within parent graph
    this.graph = parentGraph; // array (or object) of other Cells
    this.nbrs = {}; // hash set of parentGraph indices (or keys)
}

// has no effect if neighbor link already exists.
// neighbor Cells MUST already exist within the parent graph.
Cell.prototype.addNbrs = function (coordArr)
{
    var that = this;
    coordArr.forEach(function (coord) {
        that.addNbr(coord);
    });
}

// has no effect if neighbor link already exists.
// neighbor Cells MUST already exist within the parent graph.
Cell.prototype.addNbr = function (coord)
{
    // add neighbor to list
    if (!this.nbrs[coord]) this.nbrs[coord] = true;
    // add self as neighbor to new neighbor
    var nbr = this.graph[coord];
    if (!nbr.nbrs[this.idx]) nbr.nbrs[this.idx] = true;
}

// has no effect if no neighbor link exists
Cell.prototype.delNbrs = function (coordArr)
{
    var that = this;
    coordArr.forEach(function (coord) {
        that.delNbr(coord);
    });
}

// has no effect if no neighbor link exists
Cell.prototype.delNbr = function (coord)
{
    // remove neighbor from list
    if (this.nbrs[coord]) delete this.nbrs[coord];
    // remove self from neighbor list of ex-neigbor
    var nbr = this.graph[coord];
    if (nbr.nbrs[this.idx]) delete nbr.nbrs[this.idx];
}