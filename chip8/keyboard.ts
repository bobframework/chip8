const keymap: any = {
    49: 0x1, // 1
    50: 0x2, // 2
    51: 0x3, // 3
    52: 0xc, // 4
    81: 0x4, // Q
    87: 0x5, // W
    69: 0x6, // E
    82: 0xD, // R
    65: 0x7, // A
    83: 0x8, // S
    68: 0x9, // D
    70: 0xE, // F
    90: 0xA, // Z
    88: 0x0, // X
    67: 0xB, // C
    86: 0xF  // V
}

const keysPressed: any[] = [];

let onNextKeyPress: Function | null = null;

export const clearOnNextKeyPress = () => {
    onNextKeyPress = null;
}

export const setOnNextKeyPress = (cb: Function) => {
    onNextKeyPress = cb;
}

export const isKeyPressed = (keyCode: number) => {
    return keysPressed[keyCode];
}

const onKeyDown = ({ which }: { which: number }) => {
    console.log("keydown:", which);
    const key = keymap[which];
    console.log("key:", key);
    keysPressed[key] = true;

    // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key
    if (onNextKeyPress !== null && key) {
        onNextKeyPress(parseInt(key));
        onNextKeyPress = null;
    }
}

const onKeyUp = ({ which }: { which: number }) => {
    let key = keymap[which];
    keysPressed[key] = false;
    console.log(keysPressed);
}

window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);
