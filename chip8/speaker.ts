const AudioContext = window.AudioContext || window.AudioContext;
let audioCtx: AudioContext = new AudioContext();;
let gain: any = audioCtx.createGain();
let finish: any = audioCtx.destination;
let oscillator: any;
gain.connect(finish);

export const play = (frequency: number) => {
    if (audioCtx && !oscillator) {
        oscillator = audioCtx.createOscillator();

        // Set the frequency
        oscillator.frequency.setValueAtTime(frequency || 440, audioCtx.currentTime);

        // Square wave
        oscillator.type = 'square';

        // Connect the gain and start the sound
        oscillator.connect(gain);
        oscillator.start();
    }
}

export const stop = () => {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
    }
}