
// Simulation variables
let threshold = 0.5;
let populationSplit = 0.5;
let emptyPercentage = 0.05;
let timeoutID;
let isPaused;
let epochCount = 0;
let similarityCount = 0;
let gridSize = 50;

// Epoch variables
let unhappy = [];
let empty = [];
let unhappyCounts = [];
let similarityCounts = [];

// SVG variables
const cellSpacing = 1;
const cellSize = 8;
const offset = (cellSpacing + cellSize) * 10;
const width = (cellSpacing + cellSize) * gridSize + offset;
const height = 990;

// Settings div
const settings = d3.selectAll("#rhs-top")
    .append("div")


// Controls div
const controls = d3.selectAll("#rhs-bottom")
    .append("div")
    .attr("class", "controls")
    .attr("width", width)
    .attr("display", "flex")
    .attr("justify-content", "space-around")

// SVG
const svg = d3.selectAll("#graph")
    .append("svg")
    .attr("width", width + "px")
    .attr("height", height + "px")
    ;

// Settings sliders
const addSlider = (name, min, max, step, value, f) => {
    const label = settings.append("div")
        .text(`${name}: ${value}%`);

    settings.append("input")
        .attr("type", "range")
        .attr("min", min)
        .attr("max", max)
        .attr("step", step)
        .attr("value", value)
        .attr("id", name)
        .on("input", (d) => {
            f(d.target.value);
            label.text(`${name}: ${d.target.value}%`);
            reset();
        });
}

addSlider("Population Distribution", 0, 100, 1, 50, (value) => populationSplit = value / 100);
addSlider("Similarity Threshold", 0, 100, 1, threshold * 100, (value) => threshold = value / 100);
addSlider("Empty", 0, 100, 5, emptyPercentage * 100, (value) => emptyPercentage = value / 100);


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

// Summary lines
const summary = d3.select("#summary");
const epochCountLabel = summary.append("div").attr("class", "label");
const unhappyCountLabel = summary.append("div").attr("class", "label");

// Grid
let grid = svg.append("g")
    .attr("class", "cells")
    .selectAll("rect");


const noAgents = gridSize * gridSize;

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
let board = new Array(gridSize);
for (let i = 0; i < gridSize; i++) {
    board[i] = new Array(gridSize);
}

const colIndex = i => Math.floor(i % gridSize)
const rowIndex = i => Math.floor(i / gridSize)

grid = grid.data(d3.range(noAgents));

// Spline chart
const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const chartWidth = 400 - margin.left - margin.right;
const chartHeight = 300 - margin.top - margin.bottom;

const xScale = d3.scaleLinear()
    .domain([0, epochCount])
    .range([0, chartWidth]);

const yScale1 = d3.scaleLinear()
    .domain([0, noAgents])
    .range([chartHeight, 0]);

const yScale2 = d3.scaleLinear()
    .domain([0, 1])
    .range([chartHeight, 0]);

const xAxis = d3.axisBottom(xScale);
const yAxis1 = d3.axisLeft(yScale1);
const yAxis2 = d3.axisRight(yScale2);

const line1 = d3.line()
    .x((d, i) => xScale(i))
    .y(d => yScale1(d));

const line2 = d3.line()
    .x((d, i) => xScale(i))
    .y(d => yScale2(d));

const chart = d3.select("#chart")
    .append("svg")
    .attr("width", chartWidth + margin.left + margin.right)
    .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

chart.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis);

chart.append("g")
    .attr("class", "y axis left")
    .call(yAxis1);

chart.append("g")
    .attr("class", "y axis right")
    .attr("transform", `translate(${chartWidth}, 0)`)
    .call(yAxis2);

const unhappyPath = chart.append("path")
    .datum(unhappyCounts)
    .attr("class", "line")
    .attr("d", line1);

const similarityPath = chart.append("path")
    .datum(similarityCounts)
    .attr("class", "line")
    .attr("d", line2);

// Draw Grid
function drawGrid() {
    generateRandomGrid()

    grid.join("rect")
        .attr("width", 0)
        .attr("height", cellSize)
        .attr("x", i => (cellSpacing + cellSize) * (colIndex(i)))
        .attr("y", i => (cellSpacing + cellSize) * (rowIndex(i)))
        .style("fill", (d, i) => tenantColors[board[rowIndex(i)][colIndex(i)]])
        .attr("width", cellSize);

    epochCountLabel
        .attr("dy", ".71em")
        .text(`No. of epochs ${epochCount}`);

    updateGrid();
}


d3.select(self.frameElement).style("height", height + "px");

function relocate(i, j) {
    const curr_group = board[i][j];
    const idx = Math.floor(Math.random() * empty.length);
    const [x, y] = empty[idx]
    board[i][j] = 0
    board[x][y] = curr_group
    empty.splice(idx, 1)
    empty.push([i, j])
}

// Calculate similarity score for a group at position i, j
function similarityScore(group, i, j) {
    let similar = -1;  // reduce one to exclude self-matches
    let total = 0;
    for (let x = d3.max([0, i - 1]); x <= d3.min([i + 1, gridSize - 1]); x++) {
        for (let y = d3.max([0, j - 1]); y <= d3.min([j + 1, gridSize - 1]); y++) {
            if (board[x][y] !== tenants.Empty) total++;
            if (group === board[x][y]) similar++;
        }
    }
    return { similar, total };
}

const isHappy = (i, j) => {
    const group = board[i][j];
    let { similar, total } = similarityScore(group, i, j);
    similarityCount += similar;
    return similar / total >= threshold;
}

const updateGrid = () => {
    epochCountLabel.attr("dy", ".71em").text(`No. of epochs: ${epochCount}`);
    unhappyCountLabel.attr("dy", ".71em").text(`Unhappy tenants: ${unhappy.length}`);
    d3.selectAll("rect").style("fill", (d, i) => tenantColors[board[rowIndex(i)][colIndex(i)]]);
};

const updateSplineChart = () => {

    unhappyPath.datum(unhappyCounts).attr("d", line1);
    similarityPath.datum(similarityCounts).attr("d", line2);
}


function runEpoch() {
    unhappy = [];
    empty = [];
    similarityCount = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (!board[i][j]) {
                empty.push([i, j])
            } else {
                if (!isHappy(i, j)) {
                    unhappy.push([i, j]);
                }
            }
        }
    }
    epochCount++;

    for (const [i, j] of d3.shuffle(unhappy)) {
        relocate(i, j)
    }

    similarityCounts.push(similarityCount);
    unhappyCounts.push(unhappy.length);

    updateGrid();
    updateSplineChart();
}


const startEpochs = () => {
    runEpoch();

    if (typeof timeoutID == "number" && (unhappy.length === 0 || isPaused)) {
        clearTimeout(timeoutID);
    } else {
        timeoutID = setTimeout(startEpochs, 300);
    }
};

function generateRandomGrid() {
    for (let i in d3.range(noAgents)) {
        let x = rowIndex(i),
            y = colIndex(i);
        board[x][y] = Math.random() < emptyPercentage ? tenants.Empty :
            Math.random() < populationSplit ? tenants.Red : tenants.Blue;

    }
}


drawGrid();

var select = d3.select("body")
    .append("select")
    .on("change", function () {
        gridSize = +this.value;
        gridWidth = gridHeight = gridSize * 30;
        svg.attr("width", gridWidth)
            .attr("height", gridHeight);
        svg.selectAll(".cell").remove();
        drawGrid();
    });

