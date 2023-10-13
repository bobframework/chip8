let cols: number = 64;
let rows: number = 32;
let scale: number = 1;

const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
let display: any[] = [];


export const init = (app: Document, _scale: number) => {
    scale = _scale;
    if (canvas) {
        app.appendChild(canvas);
    }

    canvas.width = cols * scale;
    canvas.height = rows * scale;

    display = new Array(cols * rows);
}


export const setPixel = (x: number, y: number) => {
    if (x > cols) {
        x -= cols;
    } else if (x < 0) {
        x += cols;
    }

    if (y > rows) {
        y -= rows;
    } else if (y < 0) {
        y += rows;
    }

    let pixelLoc = x + (y * cols);

    display[pixelLoc] ^= 1;

    return !display[pixelLoc];
}

export const clear = () => {
    display = new Array(cols * rows);
}

export const render = () => {
    // Clears the display every render cycle. Typical for a render loop.

    if (!ctx) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through our display array
    for (let i = 0; i < cols * rows; i++) {
        // Grabs the x position of the pixel based off of `i`
        let x = (i % cols) * scale;

        // Grabs the y position of the pixel based off of `i`
        let y = Math.floor(i / cols) * scale;

        // If the value at display[i] == 1, then draw a pixel.
        if (display[i]) {
            // Set the pixel color to black
            ctx.fillStyle = '#000';

            // Place a pixel at position (x, y) with a width and height of scale
            ctx.fillRect(x, y, scale, scale);
        }
    }
}