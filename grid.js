const formatNumber = d3.format(",d");

const svg = d3.select("svg");

const width = +svg.attr("width"),
    height = +svg.attr("height");

const cellSpacing = 1,
    cellSize = Math.floor(width / 100) - cellSpacing,
    offset = Math.floor((width - 100 * cellSize - 90 * cellSpacing) / 2);

const updateDuration = 125,
    updateDelay = updateDuration / 500;


const label = svg.append("text")
    .attr("class", "label");

const n0 = grid.size();
const n1 = 50*50
const n2 = Math.floor(Math.sqrt(n1))

let board = new Array(n2);
for (let i = 0; i < n2; i++) {
    board[i] = new Array(n2);
}

let grid = svg.append("g")
    .attr("class", "cells")
    .attr("transform", "translate(" + offset + "," + (offset + 30) + ")")
    .selectAll("rect");

let row = grid.selectAll(".row")
    .data(board)
    .attr("class", "row")

/*
cell = cell
    .data(d3.range(n1));
*/

grid.enter().append("rect")
    .attr("width", 0)
    .attr("height", cellSize)
    .attr("x", i => (cellSpacing + cellSize) * (Math.floor(i % n2)))
    .attr("y", i => (cellSpacing + cellSize) * (Math.floor(i / n2)))
    .attr("width", cellSize);

label
    .attr("x", offset)
    .attr("y", offset)
    .attr("dy", ".71em")
    .transition()
    .duration(Math.abs(n1 - n0) * updateDelay + updateDuration / 2)
    .ease("linear")
    .tween("text", function() {
        const i = d3.interpolateNumber(n0, n1);
        return function(t) {
            this.textContent = formatNumber(Math.round(i(t)));
        };
    });


d3.select(self.frameElement).style("height", height + "px");
