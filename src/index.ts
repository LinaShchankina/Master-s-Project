import { Program } from '../src/program';
//import { WebGLProgram } from 'three';

export interface Buffers {
	[key: string]: WebGLBuffer | null;
}

export interface FramebufferInfo {
	framebuffer: WebGLFramebuffer;
	textures: WebGLTexture[];
}

export interface ShaderProgramInfo {
	program: WebGLProgram;
	attribLocations: { [key: string]: number };
	uniformLocations: { [key: string]: WebGLUniformLocation };
}

function colorBinding(max: number, min: number) {
	var colorLength = max - min;
	var colorStep = colorLength / 9;
	document.getElementById('lbl1')!.textContent = max.toExponential(5);
	document.getElementById('lbl2')!.textContent = (max - colorStep).toExponential(5);
	document.getElementById('lbl3')!.textContent = (max - colorStep * 2).toExponential(5);
	document.getElementById('lbl4')!.textContent = (max - colorStep * 3).toExponential(5);
	document.getElementById('lbl5')!.textContent = (max - colorStep * 4).toExponential(5);
	document.getElementById('lbl6')!.textContent = (max - colorStep * 5).toExponential(5);
	document.getElementById('lbl7')!.textContent = (max - colorStep * 6).toExponential(5);
	document.getElementById('lbl8')!.textContent = (max - colorStep * 7).toExponential(5);
	document.getElementById('lbl9')!.textContent = (max - colorStep * 8).toExponential(5);
	document.getElementById('lbl10')!.textContent = (max - colorStep * 9).toExponential(5);
}

export function initColor(color: Uint8Array, min: number, max: number) {
	let k = 0,
		l = 255;
	for (let i = 0; i < 3 * 512; i += 3) {
		if (k <= 255) {
			color[i] = 255;
			color[i + 1] = k;
			k++;
		} else {
			color[i] = l;
			color[i + 1] = 255;
			l--;
		}
		color[i + 2] = 0;
	}

	const step = Math.round(color.length / 9);
	for (let i = 0; i < 10; i++) {
		if (document) {
			let first = i * step > color.length ? color.length - 3 : i * step;
			let elem = document.getElementById(`col${i + 1}`);
			elem!.style.backgroundColor = `rgb(${color[first]}, ${color[first + 1]}, ${color[first + 2]})`;
		}
	}
	colorBinding(max, min);
}

export function dichotomyMethod(timePoints: number[], currentValue: number): number[] {
	let leftIndex = 0;
	let rightIndex = timePoints.length - 1;
	while (rightIndex - leftIndex != 1) {
		let tmp = Math.floor((rightIndex + leftIndex) / 2);
		if (currentValue < timePoints[tmp]) rightIndex = tmp;
		else leftIndex = tmp;
	}
	return [leftIndex, rightIndex];
}

async function mainWebGL() {
	if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
		alert('ERROR: file API is not supported!');
		return;
	}
	let program = new Program();
	program.initEventHandlers();
}

declare global {
	interface Window {
		mainWebGL: () => void;
	}
}
window.mainWebGL = mainWebGL;
