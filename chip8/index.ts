import * as renderer from './renderer';
import * as cpu from './cpu';

let fpsInterval: number;
let now, then: number, elapsed;

const looping = () => {
	now = Date.now();
	elapsed = now - then;
	if (elapsed > fpsInterval) {
		cpu.cycle();
	}
	requestAnimationFrame(looping);
}

export const init = (_querySelector: any, _scale: number, _fps = 60) => {
	renderer.init(document.querySelector(_querySelector), _scale)
	fpsInterval = 1000 / _fps;
	// cpu.loadSpritesIntoMemory();
	then = Date.now();
	looping();
}

export const loadRomFromUrl = (url: any) => {
	cpu.loadRomFromURL(url);
}

export const loadRomFromStream = (arrayBuffer: any) => {
	cpu.loadRomFromArrayBuffer(arrayBuffer);
	// cpu.loadSpritesIntoMemory();
}