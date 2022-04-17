const w = 480;
const h = 480;
const s = 24;
const cols = (w / s) | 0;
const rows = (h / s) | 0;
const grid = Array(rows).fill().map(() => Array(cols).fill(null));
const shapes = [];
let notDone = true;
let ctx;
let lineChart;
const segregationData = [];
const unhappyData = [];

function setup() {
    createCanvas(w, h);
    frameRate(5);
    const poss = Array(rows).fill().map((x, j) => Array(cols).fill().map((x, i) => [i, j]));
    const spots = poss.flat();
    for (let i = 0; i < 160; i++) {
        const idx = random(spots.length) | 0;
        const choice = spots[idx];
        const shape = new Polygon(choice[0], choice[1], false);
        shapes.push(shape);
        grid[choice[1]][choice[0]] = shape;
        spots.splice(idx, 1);
    }
    for (let i = 0; i < 160; i++) {
        const idx = random(spots.length) | 0;
        const choice = spots[idx];
        const shape = new Polygon(choice[0], choice[1], true);
        shapes.push(shape);
        grid[choice[1]][choice[0]] = shape;
        spots.splice(idx, 1);
    }
    computeSegregation();
    ctx = select("#myChart").elt.getContext("2d");
    lineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: Array(100).fill().map((x, i) => i),
            datasets: [{
                label: "Segregation",
                backgroundColor: "rgba(0, 0, 0, 0)",
                borderColor: "rgb(255, 99, 132)",
                data: segregationData.slice()
            },
                {
                    label: "Unhappy Shapes",
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    borderColor: "rgb(128, 255, 128)",
                    data: unhappyData.slice()
                }]
        }
    });
}

function getNeighborCount(shape) {
    let triangleCount = 0, squareCount = 0;
    for (let joff = -1; joff <= 1; joff++) {
        for (let ioff = -1; ioff <= 1; ioff++) {
            const i = shape.i + ioff;
            const j = shape.j + joff;
            if ((ioff != 0 || joff != 0) && i >= 0 && i < cols && j >= 0 && j < rows) {
                if (grid[j][i]) {
                    if (grid[j][i].type) squareCount++;
                    else triangleCount++;
                }
            }
        }
    }
    return [triangleCount, squareCount];
}

function getNeighborFraction(shape) {
    const counts = getNeighborCount(shape);
    if (shape.type) return counts[1] / (counts[0] + counts[1]);
    else return counts[0] / (counts[0] + counts[1]);
}

function computeSegregation() {
    let count = 0;
    let ucount = 0;
    for (const s of shapes) {
        if (getNeighborFraction(s) == 1) count++;
        if (getNeighborFraction(s) < 1 / 3) ucount++;
    }
    count /= shapes.length;
    ucount /= shapes.length;
    console.log(count);
    segregationData.push(count);
    unhappyData.push(ucount);
}

function draw() {
    background(220);
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            stroke(0);
            noFill();
            square(i * s, j * s, s);
        }
    }
    for (const s of shapes) {
        s.render();
    }
    if (frameCount % 1 == 0 && notDone) {
        const empty = [];
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                if (!grid[j][i]) empty.push([i, j]);
            }
        }
        const notTriedShapes = shapes.slice();
        let idx = random(notTriedShapes.length) | 0;
        let sh = notTriedShapes[idx];
        while (getNeighborFraction(sh) >= 1 / 3) {
            notTriedShapes.splice(idx, 1);
            if (notTriedShapes.length == 0) {
                print("DONE");
                notDone = false;
                noLoop()
                return;
            }
            idx = random(notTriedShapes.length) | 0;
            sh = notTriedShapes[idx];
        }
        grid[sh.j][sh.i] = null;
        const choice = random(empty);
        sh.i = choice[0];
        sh.j = choice[1];
        grid[sh.j][sh.i] = sh;
    }
    if (frameCount % 10 == 0) {
        lineChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: Array(100).fill().map((x, i) => i),
                datasets: [{
                    label: "Segregation",
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    borderColor: "rgb(255, 99, 132)",
                    data: segregationData.slice()
                },
                    {
                        label: "Unhappy Shapes",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        borderColor: "rgb(128, 255, 128)",
                        data: unhappyData.slice()
                    }]
            }
        });
    }
    computeSegregation();
}

function equilateral(x, y, b) {
    const h = sqrt(3) / 2 * b;
    triangle(x, y - h / 2, x - b / 2, y + h / 2, x + b / 2, y + h / 2);
}

class Polygon {
    constructor(i, j, type) {
        this.i = i;
        this.j = j;
        this.type = type;
    }

    renderTooltip() {
        stroke(0);
        fill(255);
        square(this.i * s, this.j * s, s);
        textAlign(CENTER, CENTER);
        textSize(9);
        noStroke();
        if (this.type) fill(0, 0, 255);
        else fill(204, 204, 0);
        text(getNeighborFraction(this).toFixed(3), this.i * s + s / 2, this.j * s + s / 4);
        const counts = getNeighborCount(this);
        text(counts[0] + counts[1], this.i * s + s / 2, this.j * s + 3 * s / 4);
    }

    render() {
        const x = this.i * s + s / 2;
        const y = this.j * s + s / 2;
        const h = sqrt(3) * 9;
        if (this.type) {
            stroke(0);
            fill(0, 0, 255);
            square(x - h / 2, y - h / 2, h);
        } else {
            stroke(0);
            fill(255, 255, 0);
            equilateral(x, y, 18);
        }
        if (mouseX >= x - s / 2 && mouseX < x + s / 2 && mouseY >= y - s / 2 && mouseY < y + s / 2) {
            this.renderTooltip();
        }
    }
}