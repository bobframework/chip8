import * as keyboard from "./keyboard";
import * as renderer from "./renderer";
import * as speaker from "./speaker";

// Program counter. Stores the currently executing address.
let pc: number = 0x200;

// Don't initialize this with a size in order to avoid empty results.
const stack: any[] = new Array();

// 16 8-bit registers
const v = new Uint8Array(16);

// 4KB (4096 bytes) of memory
const memory = new Uint8Array(4096);

// Stores memory addresses. Set this to 0 since we aren't storing anything at initialization.
let i: number = 0;

// Timers
let delayTimer: number = 0;
let soundTimer: number = 0;

// Some instructions require pausing, such as Fx0A.
let paused: boolean = false;
let speed: number = 10;
let rowLoaded: boolean = false;

// Array of hex values for each sprite. Each sprite is 5 bytes.
// The technical reference provides us with each one of these values.
const sprites = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

const loadSpritesIntoMemory = () => {
    // According to the technical reference, sprites are stored in the interpreter section of memory starting at hex 0x000
    for (let i = 0; i < sprites.length; i++) {
        memory[i] = sprites[i];
    }
}

const loadProgramIntoMemory = (program: string | any[] | Uint8Array) => {
    for (let loc = 0; loc < program.length; loc++) {
        memory[0x200 + loc] = program[loc];
    }
    loadSpritesIntoMemory();
    rowLoaded = true;
}

export const loadRomFromURL = (romUrl: RequestInfo | URL) => {
    rowLoaded = false;
    fetch(romUrl, {
        method: "GET"
    }).then((response) => {
        return response.arrayBuffer();
    }).then((arrayBuffer) => {
        const program = new Uint8Array(arrayBuffer);
        loadProgramIntoMemory(program);
        rowLoaded = true;
    }).catch(err => console.log(err));
}

export const loadRomFromArrayBuffer = (arrayBuffer: Iterable<number>) => {
    rowLoaded = false;
    const program = new Uint8Array(arrayBuffer);
    loadProgramIntoMemory(program);
}

export const cycle = () => {
    if (!rowLoaded) {
        return false;
    }
    for (let i = 0; i < speed; i++) {
        if (!paused) {
            let opcode = (memory[pc] << 8 | memory[pc + 1]);
            executeInstruction(opcode);
        }
    }

    if (!paused) {
        updateTimers();
    }

    playSound();
    renderer.render();
}

const updateTimers = () => {
    if (delayTimer > 0) {
        delayTimer -= 1;
    }

    if (soundTimer > 0) {
        soundTimer -= 1;
    }
}

const playSound = () => {
    if (soundTimer > 0) {
        speaker.play(440);
    } else {
        speaker.stop();
    }
}

const executeInstruction = (opcode: any) => {
    // Increment the program counter to prepare it for the next instruction.
    // Each instruction is 2 bytes long, so increment it by 2.
    pc += 2;

    // We only need the 2nd nibble, so grab the value of the 2nd nibble and shift it right 8 bits to get rid of everything but that 2nd nibble.
    let x = (opcode & 0x0F00) >> 8;

    // We only need the 3rd nibble, so grab the value of the 3rd nibble and shift it right 4 bits to get rid of everything but that 3rd nibble.
    let y = (opcode & 0x00F0) >> 4;

    switch (opcode & 0xF000) {
        case 0x0000:
            switch (opcode) {
                case 0x00E0:
                    renderer.clear();
                    break;
                case 0x00EE:
                    pc = stack.pop();
                    break;
            }
            break;
        case 0x1000:
            pc = (opcode & 0xFFF);
            break;
        case 0x2000:
            stack.push(pc);
            pc = (opcode & 0xFFF);
            break;
        case 0x3000:
            if (v[x] === (opcode & 0xFF)) {
                pc += 2;
            }
            break;
        case 0x4000:
            if (v[x] !== (opcode & 0xFF)) {
                pc += 2;
            }
            break;
        case 0x5000:
            if (v[x] === v[y]) {
                pc += 2;
            }
            break;
        case 0x6000:
            v[x] = (opcode & 0xFF);
            break;
        case 0x7000:
            v[x] += (opcode & 0xFF);
            break;
        case 0x8000:
            switch (opcode & 0xF) {
                case 0x0:
                    v[x] = v[y];
                    break;
                case 0x1:
                    v[x] |= v[y]
                    break;
                case 0x2:
                    v[x] &= v[y];
                    break;
                case 0x3:
                    v[x] ^= v[y];
                    break;
                case 0x4:
                    let sum = (v[x] += v[y]);

                    v[0xF] = 0;

                    if (sum > 0xFF) {
                        v[0xF] = 1;
                    }

                    v[x] = sum;
                    break;
                case 0x5:
                    v[0xF] = 0;

                    if (v[x] > v[y]) {
                        v[0xF] = 1;
                    }

                    v[x] -= v[y];
                    break;
                case 0x6:
                    v[0xF] = (v[x] & 0x1);

                    v[x] >>= 1;
                    break;
                case 0x7:
                    v[0xF] = 0;

                    if (v[y] > v[x]) {
                        v[0xF] = 1;
                    }

                    v[x] = v[y] - v[x];
                    break;
                case 0xE:
                    v[0xF] = (v[x] & 0x80);
                    v[x] <<= 1;
                    break;
            }
            break;
        case 0x9000:
            if (v[x] !== v[y]) {
                pc += 2;
            }
            break;
        case 0xA000:
            i = (opcode & 0xFFF);
            break;
        case 0xB000:
            pc = (opcode & 0xFFF) + v[0];
            break;
        case 0xC000:
            let rand = Math.floor(Math.random() * 0xFF);

            v[x] = rand & (opcode & 0xFF);
            break;
        case 0xD000:
            let width = 8;
            let height = (opcode & 0xF);

            v[0xF] = 0;

            for (let row = 0; row < height; row++) {
                let sprite = memory[i + row];

                for (let col = 0; col < width; col++) {
                    // If the bit (sprite) is not 0, render/erase the pixel
                    if ((sprite & 0x80) > 0) {
                        // If setPixel returns 1, which means a pixel was erased, set VF to 1
                        if (renderer.setPixel(v[x] + col, v[y] + row)) {
                            v[0xF] = 1;
                        }
                    }

                    // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
                    // Ex. 10010000 << 1 will become 0010000
                    sprite <<= 1;
                }
            }
            break;
        case 0xE000:
            switch (opcode & 0xFF) {
                case 0x9E:
                    if (keyboard.isKeyPressed(v[x])) {
                        pc += 2;
                    }
                    break;
                case 0xA1:
                    if (!keyboard.isKeyPressed(v[x])) {
                        pc += 2;
                    }
                    break;
            }
            break;
        case 0xF000:
            switch (opcode & 0xFF) {
                case 0x07:
                    v[x] = delayTimer;
                    break;
                case 0x0A:
                    paused = true;
                    keyboard.setOnNextKeyPress((key: any) => {
                        console.log("next:", key);
                        v[x] = key;
                        paused = false;
                    });
                    break;
                case 0x15:
                    delayTimer = v[x];
                    break;
                case 0x18:
                    soundTimer = v[x];
                    break;
                case 0x1E:
                    i += v[x];
                    break;
                case 0x29:
                    i = v[x] * 5;
                    break;
                case 0x33:
                    // Get the hundreds digit and place it in I.
                    memory[i] = v[x] / 100;

                    // Get tens digit and place it in I+1. Gets a value between 0 and 99, then divides by 10 to give us a value
                    // between 0 and 9.
                    memory[i + 1] = (v[x] % 100) / 10;

                    // Get the value of the ones (last) digit and place it in I+2. 0 through 9.
                    memory[i + 2] = v[x] % 10;
                    break;
                case 0x55:
                    for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                        memory[i + registerIndex] = v[registerIndex];
                    }
                    break;
                case 0x65:
                    for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                        v[registerIndex] = memory[i + registerIndex];
                    }
                    break;
            }
            break;
        default:
            throw new Error('Unknown opcode ' + opcode);
    }
}