const formatNumber = d3.format(",d");

const svg = d3.select("svg");

const width = +svg.attr("width"),
    height = +svg.attr("height");

const cellSpacing = 1,
    cellSize = Math.floor(width / 100) - cellSpacing,
    offset = Math.floor((width - 100 * cellSize - 90 * cellSpacing) / 2);

const updateDuration = 125,
    updateDelay = updateDuration / 500;

let cell = svg.append("g")
    .attr("class", "cells")
    .attr("transform", "translate(" + offset + "," + (offset + 30) + ")")
    .selectAll("rect");

const label = svg.append("text")
    .attr("class", "label");

const n0 = cell.size();
const n1 = 50 * 50
const n2 = Math.floor(Math.sqrt(n1))

const tenants = {
    Empty: 0,
    Red: 1,
    Blue: 2,
}

const tenantColors = {
    0: "black",
    1: "mediumslateblue",
    2: "chartreuse"
}

let tenant;
let board = new Array(n2);
for (let i = 0; i < n2; i++) {
    board[i] = new Array(n2);
}

const colIndex = i => Math.floor( i % n2)
const rowIndex = i => Math.floor(i / n2)

for (let i = 0; i < n2; i++) {
    for (let j = 0; j < n2; j++) {
        if (Math.random() <= 0.05) {
            tenant = 0;
        } else if (Math.random() <= 0.5) {
            tenant = 1;
        } else {
            tenant = 2;
        }
        board[i][j] = tenant
    }
}

cell = cell
    .data(d3.range(n1));

cell.enter().append("rect")
    .attr("width", 0)
    .attr("height", cellSize)
    .attr("x", i => (cellSpacing + cellSize) * (colIndex(i)))
    .attr("y", i => (cellSpacing + cellSize) * (rowIndex(i)))
    .style("fill", (d, i) => tenantColors[board[rowIndex(i)][colIndex(i)]])
    .attr("width", cellSize);

label
    .attr("x", offset)
    .attr("y", offset)
    .attr("dy", ".71em")
    .transition()
    .duration(Math.abs(n1 - n0) * updateDelay + updateDuration / 2)
    .ease("linear")
    .tween("text", function () {
        const i = d3.interpolateNumber(n0, n1);
        return function (t) {
            this.textContent = formatNumber(Math.round(i(t)));
        };
    });


d3.select(self.frameElement).style("height", height + "px");
