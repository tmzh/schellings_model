// Simulation variables
let unhappy, empty;

// Grid variables
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
let threshold = 0.33;

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
            tenant = tenants.Empty;
        } else if (Math.random() <= 0.5) {
            tenant = tenants.Red;
        } else {
            tenant = tenants.Blue;
        }
        board[i][j] = tenant
    }
}

cell = cell
    .data(d3.range(n1));

function redraw() {
    cell.enter().append("rect")
        .attr("width", 0)
        .attr("height", cellSize)
        .attr("x", i => (cellSpacing + cellSize) * (colIndex(i)))
        .attr("y", i => (cellSpacing + cellSize) * (rowIndex(i)))
        .style("fill", (d, i) => tenantColors[board[rowIndex(i)][colIndex(i)]])
        .attr("width", cellSize);
}

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

function relocate(i, j) {
    const curr_group = board[i][j];
    let idx = Math.floor(Math.random()*empty.length)
    const [x, y] = empty[idx]
    board[i][j] = 0
    board[x][y] = curr_group
    empty.splice(idx, 1)
    empty.push([i, j])
}

function is_happy(i, j) {
    let similar = -1;  // reduce one to exclude self-matches
    let total = 0;
    const group = board[i][j];
    for (let x = d3.max([0, i - 1]); x <= d3.min([i + 1, n2 - 1]); x++) {
        for (let y = d3.max([0, j - 1]); y <= d3.min([j + 1, n2 - 1]); y++) {
            total++;
            if (group === board[x][y]) similar++;
        }
    }
    return similar / total >= threshold;
}

function generate() {
    unhappy = [];
    empty = [];
    for (let i = 0; i < n2; i++) {
        for (let j = 0; j < n2; j++) {
            if (!board[i][j]) empty.push([i, j])
            else {
                if (!is_happy(i, j)) {
                    unhappy.push([i, j]);
                }
            }
        }

    }

    for (const [i, j] of unhappy) {
        relocate(i, j)
    }

    redraw();

    console.log(`Unhappy Count: ${unhappy.length}`)

}

redraw();

(function interval() {
    generate();
    setTimeout(interval, updateDelay * 1000);
})();
