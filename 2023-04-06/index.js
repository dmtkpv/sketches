const { abs, sin, cos, sqrt, asin, acos, pow, atan, PI } = Math;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');


const S = 800;
canvas.width = S;
canvas.height = S;

const options = JSON.parse(localStorage.getItem('options')) ?? {
    offset: 0,
    length: 2,
    horizontal: false
}

const hole = {
    x: 0,
    y: 0,
    r1: 0.3,
    r2: 0.5
}

/*
fwidth
abs(dFdx(p)) + abs(dFdy(p))
* */


// ------------------
// Math
// ------------------

const D = .5,     // push distance
    n = 3.;

function transform (point) {



    let [x, y] = point;

    y = y + cos(x * 10)/ 20;

    //console.log(x, y)

    const length = sqrt(x * x + y * y);


    const newLength = length * pow( 1.+pow(D/length,n), 1./n );
    const myLength = length * pow(pow(length, n) + pow(D, n), 1./n);

    x /= length;
    y /= length;

    x *= newLength;
    y *= newLength;




    return [x, y];
}




// ------------------
// Helpers
// ------------------

function drawPoint ([x, y], color = '#CCC') {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLine (a, b, color = '#CCC') {
    ctx.beginPath();
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawCircle ([x, y], r, color = '#CCC') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
}



// ------------------
// Update
// ------------------

function update () {

    localStorage.setItem('options', JSON.stringify(options));

    function project (point) {
        const x = (point[0] + 1) / 2 * S;
        const y = (1 - point[1]) / 2 * S;
        return [x, y];
    }

    const coords = Array(options.length).fill().map((_, i) => {
        const x = -1 + i / (options.length - 1) * 2;
        const y = options.offset;
        return options.horizontal ? [x, y] : [y, x];
    })

    const original = coords.map(coord => project(coord));
    const transformed = coords.map(coord => project(transform(coord)));


    ctx.clearRect(0, 0, S, S);

    drawPoint([S/2, S]);
    drawLine([S/2, 0], [S/2, S]);
    drawLine([0, S/2], [S, S/2]);

    drawCircle([S/2, S/2], hole.r1 * S/2);
    drawCircle([S/2, S/2], hole.r2 * S/2);

    for (let i = 0; i < original.length; i++) {
        if (!i) continue;
        drawLine(original[i-1], original[i], '#999');
        drawPoint(original[i], '#666    ');
    }

    for (let i = 0; i < transformed.length; i++) {
        if (!i) continue;
        drawLine(transformed[i-1], transformed[i], '#000');
        drawPoint(transformed[i], '#F00');
    }


}



// ------------------
// Init
// ------------------

const gui = new dat.GUI();
gui.add(options, 'length', 2, 100, 2).onChange(update);
gui.add(options, 'offset', -1, 1, 0.05).onChange(update);
gui.add(options, 'horizontal').onChange(update);

update();
