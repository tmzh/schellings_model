/*
TODO:
 [ ] Reset after play starts with 1st epoch
 [x] Make width same size as grid
 [ ] Add space around buttons
 [x] Align buttons with grid
 [ ] Display unhappy count in label
 [ ] Display unhappy count as spine chart
 [ ] Build sliders using d3
 */


// Simulation variables
let threshold = 0.3;
let timeoutID;
let isPaused;
let epochCount = 0;
let n0 = 100;

// Epoch variables
let unhappy = [],
    empty = [];

// SVG variables
const width = 960,
    height = 990;

const cellSpacing = 1,
    cellSize = Math.floor(width / n0) - cellSpacing,
    offset = Math.floor((width - n0 * cellSize - 0.9 * n0 * cellSpacing) / 2);

const updateDuration = 125,
    updateDelay = updateDuration / 500;

// Settings div
const settings = d3.select("body").append("div")
    .attr("class", "settings")
    .style("position", "relative")
    .style("top", "0")


// Controls div
const controls = d3.select("body")
    .append("div")
    .attr("class", "controls")
    .attr("width", width)
    .attr("display", "flex")
    .attr("justify-content", "space-around")
    .style("position", "relative")
    .style("left", offset + "px")

// SVG
const svg = d3.select("body")
    .append("svg")
    .attr("width", width + "px")
    .attr("height", height + "px")
;

// Settings sliders
// add input slider for threshold
const thresholdSlider = settings.append("input")
    .attr("type", "range")
    .attr("min", 0.1)
    .attr("max", 0.9)
    .attr("step", 0.01)
    .attr("value", threshold)

d3.select('#similar').on('change', () => {
    threshold = d3.select("#similar").node().value / 100;
    d3.select('#similar-value').text(`${threshold * 100}`);
})


// Control buttons

function reset() {
    stop();
    epochCount = 0;
    generateRandomGrid();
    updateGrid();
    d3.select("#stop").property('disabled', true);
    d3.select("#start").property('disabled', false);
}

const start = () => {
    isPaused = false;
    startEpochs();
    d3.select("#stop").property('disabled', false);
    d3.select("#start").property('disabled', true);
}

const stop = () => {
    isPaused = true;
    d3.select("#stop").property('disabled', true);
    d3.select("#start").property('disabled', false);
}

const add_button = (name, f, disabled = false) => {
    controls.append("button")
        .attr("id", name.toLowerCase())
        .text(name)
        .property("disabled", disabled)
        .on("click", f)
    ;
}

add_button("Reset", reset);
add_button("Start", start);
add_button("Stop", stop, true);
add_button("step", runEpoch);


// Draw the grid
let grid = svg.append("g")
    .attr("class", "cells")
    .attr("transform", "translate(" + offset + "," + (offset + 30) + ")")
    .selectAll("rect");

const label = svg.append("text")
    .attr("class", "label");

const n1 = n0 * n0;
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

const colIndex = i => Math.floor(i % n2)
const rowIndex = i => Math.floor(i / n2)

// Use this: https://bl.ocks.org/d3indepth/e890d5ad36af3d949f275e35b41a99d6
grid = grid
    .data(d3.range(n1));

function drawGrid() {
    generateRandomGrid()

    grid.join("rect")
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
        .text(`No. of epochs ${epochCount}`);

    updateGrid();
}


d3.select(self.frameElement).style("height", height + "px");

function relocate(i, j) {
    const curr_group = board[i][j];
    let idx = Math.floor(Math.random() * empty.length)
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

const updateGrid = () => {
    label
        .attr("x", offset)
        .attr("y", offset)
        .attr("dy", ".71em")
        .text(`No. of epochs ${epochCount}`)
    ;
    d3.selectAll("rect").transition().style("fill", (d, i) => tenantColors[board[rowIndex(i)][colIndex(i)]]);
};

function runEpoch() {
    unhappy = [];
    empty = [];
    for (let i = 0; i < n2; i++) {
        for (let j = 0; j < n2; j++) {
            if (!board[i][j]) {
                empty.push([i, j])
            } else {
                if (!is_happy(i, j)) {
                    unhappy.push([i, j]);
                }
            }
        }
    }
    epochCount++;

    for (const [i, j] of unhappy) {
        relocate(i, j)
    }
    updateGrid();
}


const startEpochs = () => {
    runEpoch();

    if (typeof timeoutID == "number" && (unhappy.length === 0 || isPaused)) {
        clearTimeout(timeoutID);
    } else {
        timeoutID = setTimeout(startEpochs, updateDelay * 1000);
    }
};

function generateRandomGrid() {
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
}



drawGrid();
