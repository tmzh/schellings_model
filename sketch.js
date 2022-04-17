let w;
let columns;
let rows;
let board;
let next;
let redFraction = 0.5;
let threshold = 0.3;
let emptyFraction = 0.05;
let redFractionSlider, thresholdSlider, emptySlider;
let rounds = 0;
let unhappy = [];
let empty = [];
let grid_size;

function setup() {
    createCanvas(600, 400);
    frameRate(5);
    w = 10;
    threshold = 0.30;

    grid_size = min(height, width)

    // Calculate columns and rows
    columns = floor(grid_size / w);
    rows = floor(grid_size / w);

    // Create an Array
    board = new Array(columns);
    for (let i = 0; i < columns; i++) {
        board[i] = new Array(rows);
    }

    // Create temp Array structure
    next = new Array(columns);
    for (let i = 0; i < columns; i++) {
        next[i] = new Array(rows);
    }


    redFractionSlider = createSlider(0, 1, redFraction, 0.05)
    thresholdSlider = createSlider(0, 1, threshold, 0.05)
    emptySlider = createSlider(0, 1, emptyFraction, 0.05)

    redFractionSlider.position(grid_size + 2 * w, w * 5)
    thresholdSlider.position(grid_size + 2 * w, w * 9)
    emptySlider.position(grid_size + 2 * w, w * 13)

    init();
}

function keyReleased() {
    if (keyCode === 32) if (isLooping()) noLoop();
    else loop();
}

function getPercentStr(slider) {
    return `${slider.value() * 100}%`;
}

function draw() {
    generate();
    background(255);
    rounds++;

    // restart if fraction value is changed
    if (redFractionSlider.value() !== redFraction || thresholdSlider.value() !== threshold || emptySlider.value() !== emptyFraction) {
        redFraction = redFractionSlider.value();
        threshold = thresholdSlider.value();
        emptyFraction = emptySlider.value()
        init();
    }
    for_each_cell((i, j) => {
        if (board[i][j] === 1) fill('red');
        else if (board[i][j] === 2) fill('blue');
        else fill(0);
        stroke(0);
        rect((i + 1) * w, (j + 1) * w, w, w)
    })

    fill('black')
    text(`Round ${rounds}`, grid_size + 2 * w, 2 * w)
    text(`Red/Blue : ${getPercentStr(redFractionSlider)} `, grid_size + 2 * w, w * 5);
    text(`Similar: ${getPercentStr(thresholdSlider)}`, grid_size + 2 * w, w * 9);
    text(`Percent empty: ${getPercentStr(emptySlider)} `, grid_size + 2 * w, w * 13);
    if (rounds > 10) {
        noLoop()
    }
}

function relocate(i, j) {
    const curr_group = board[i][j];
    let idx = floor(random(empty.length))
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
    for (let x = max(0, i - 1); x <= min(i + 1, columns - 1); x++) {
        for (let y = max(0, j - 1); y <= min(j + 1, rows - 1); y++) {
            total++;
            if (group === board[x][y]) similar++;
        }
    }
    return similar / total >= threshold;
}

function generate() {
    unhappy = [];
    empty = [];
    for_each_cell((i, j) => {
        if (!board[i][j]) empty.push([i, j])
        else {
            if (!is_happy(i, j)) {
                unhappy.push([i, j]);
            }
        }
    })

    for (const [i, j] of unhappy) {
        relocate(i, j)
    }

}

function for_each_cell(cell_function) {
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            cell_function(i, j);
        }
    }
}

function init() {
    rounds = 0;
    let empty_percent = emptySlider.value();
    let red_percent = redFractionSlider.value();
    let choice;
    for_each_cell((i, j) => {
        if (random() <= empty_percent) {
            choice = 0;
        } else if (random() <= red_percent) {
            choice = 1;
        } else {
            choice = 2;
        }
        board[i][j] = choice
    })
}