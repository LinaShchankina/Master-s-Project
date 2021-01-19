import { Model } from '../src/model';
import { initColor, Buffers, ShaderProgramInfo, FramebufferInfo, dichotomyMethod } from '../src/index';
import { vsSource } from '../src/shaders/vertexShader';
import { fsSource1 } from '../src/shaders/1fragmentShader';
import { fsSource2 } from '../src/shaders/2fragmentShader';
import { mat4 } from 'gl-matrix';
//import { WebGLProgram } from 'three';

export class Drawer {
	gl: WebGL2RenderingContext;
	canvas: HTMLCanvasElement;
	buffers: Buffers | null = null;
	programInfo1: ShaderProgramInfo | null = null;
	programInfo2: ShaderProgramInfo | null = null;
	frameBufferInfo: FramebufferInfo | null = null;
	scale: number = 0;
	currentAngle: number[] = [0.0, 0.0];
	countOfLines: number = 0;
	thicknessValue: number = 1;
	useWhiteMode: number = 1;
	model: Model;
	then: number = 0;
	private lastCoord: { lastX: number; lastY: number } = {
		lastX: -1,
		lastY: -1,
	};
	private dragging: boolean = false;

	constructor() {
		this.canvas = document.getElementById('canvasWebGL') as HTMLCanvasElement;
		if (!this.canvas) {
			throw new Error('ERROR: could not initialise CANVAS!');
		}
		this.gl = this.canvas.getContext('webgl2') as WebGL2RenderingContext;
		if (!this.gl) {
			throw new Error('ERROR: could not initialise WebGL Context!');
		}
		this.model = new Model();
	}

	getShader(type: number, source: string) {
		console.log(this.gl.getParameter(this.gl.VERSION));
		const shader = this.gl.createShader(type) as WebGLShader;
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			alert('ERROR' + this.gl.getShaderInfoLog(shader));
			this.gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	initShaderProgram(fsSource: string, vertexShader: WebGLShader): WebGLProgram {
		const fragmentShader = this.getShader(this.gl.FRAGMENT_SHADER as number, fsSource) as WebGLShader;
		const shaderProgram = this.gl.createProgram() as WebGLProgram;
		this.gl.attachShader(shaderProgram, vertexShader);
		this.gl.attachShader(shaderProgram, fragmentShader);
		this.gl.linkProgram(shaderProgram);
		if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS))
			alert('SHADERPROGRAM: Could not initialise shaders!');
		return shaderProgram;
	}

	initShaders() {
		const vertexShader = this.getShader(this.gl.VERTEX_SHADER as number, vsSource) as WebGLShader;

		const shaderProgram1 = this.initShaderProgram(fsSource1, vertexShader)! as WebGLProgram;
		this.programInfo1 = {
			program: shaderProgram1,
			attribLocations: {
				a_vertexPosition: this.gl.getAttribLocation(shaderProgram1, 'a_VertexPosition'),
				a_localNumbers: this.gl.getAttribLocation(shaderProgram1, 'a_LocalNumbers'),
				a_normals: this.gl.getAttribLocation(shaderProgram1, 'a_Normals'),
				a_triangleIndeces: this.gl.getAttribLocation(shaderProgram1, 'a_triangleIndex'),
			},
			uniformLocations: {
				pMatrixUniform: this.gl.getUniformLocation(shaderProgram1, 'uPMatrix'),
				mvMatrixUniform: this.gl.getUniformLocation(shaderProgram1, 'uMVMatrix'),
				minSolution: this.gl.getUniformLocation(shaderProgram1, 'uMinSolution'),
				maxSolution: this.gl.getUniformLocation(shaderProgram1, 'uMaxSolution'),
				timeIndex: this.gl.getUniformLocation(shaderProgram1, 'uTimeIndex'),
				countOfTrianglesInLayer: this.gl.getUniformLocation(shaderProgram1, 'uCountOfTriangles'),
				weightTime_Sampler: this.gl.getUniformLocation(shaderProgram1, 'weightTime_Sampler'),
			},
		} as ShaderProgramInfo;

		const shaderProgram2 = this.initShaderProgram(fsSource2, vertexShader) as WebGLProgram;
		this.programInfo2 = {
			program: shaderProgram2,
			attribLocations: {
				a_vertexPosition: this.gl.getAttribLocation(shaderProgram2, 'a_VertexPosition'),
			},
			uniformLocations: {
				pMatrixUniform: this.gl.getUniformLocation(shaderProgram2, 'uPMatrix'),
				mvMatrixUniform: this.gl.getUniformLocation(shaderProgram2, 'uMVMatrix'),
				normal_Sampler: this.gl.getUniformLocation(shaderProgram2, 'normal_Sampler'),
				color_Sampler: this.gl.getUniformLocation(shaderProgram2, 'color_Sampler'),
				grad_Sampler: this.gl.getUniformLocation(shaderProgram2, 'grad_Sampler'),
				canvasSize: this.gl.getUniformLocation(shaderProgram2, 'canvasSize'),
				countOfLines: this.gl.getUniformLocation(shaderProgram2, 'countOfLines'),
				thickness: this.gl.getUniformLocation(shaderProgram2, 'thickness'),
				useGLSLMethod: this.gl.getUniformLocation(shaderProgram2, 'useGLSLMethod'),
				useWhiteMode: this.gl.getUniformLocation(shaderProgram2, 'useWhiteMode'),
				minSolution: this.gl.getUniformLocation(shaderProgram2, 'uMinSolution'),
				maxSolution: this.gl.getUniformLocation(shaderProgram2, 'uMaxSolution'),
			},
		} as ShaderProgramInfo;
	}

	initBuffer(currentArray: Float32Array): WebGLBuffer {
		const currentBuffer = this.gl.createBuffer() as WebGLBuffer;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, currentBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, currentArray, this.gl.STATIC_DRAW);
		return currentBuffer;
	}

	async initBuffers() {
		let materialMesh = await this.model.formMaterialMesh();
		const globalCoordsBuffer = this.initBuffer(new Float32Array(materialMesh[0]));
		const normalsBuffer = this.initBuffer(new Float32Array(materialMesh[1]));
		const localCoordBuffer = this.initBuffer(new Float32Array(materialMesh[2]));
		await this.model.formCurrentSolution();
		const triangleIndecesBuffer = this.initBuffer(new Float32Array(this.model.formArrayOfTriangles()));

		this.buffers = {
			globalCoords: globalCoordsBuffer,
			localCoords: localCoordBuffer,
			normals: normalsBuffer,
			triangleIndeces: triangleIndecesBuffer,
		} as Buffers;
	}

	initFramebuffer() {
		const colorTexture = this.gl.createTexture() as WebGLTexture;
		this.gl.bindTexture(this.gl.TEXTURE_2D, colorTexture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			this.gl.canvas.width,
			this.gl.canvas.height,
			0,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			null,
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		const normalTexture = this.gl.createTexture() as WebGLTexture;
		this.gl.bindTexture(this.gl.TEXTURE_2D, normalTexture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			this.gl.canvas.width,
			this.gl.canvas.height,
			0,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			null,
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		const ext2 = this.gl.getExtension('WEBGL_depth_texture');
		const depthTexture = this.gl.createTexture() as WebGLTexture;
		this.gl.bindTexture(this.gl.TEXTURE_2D, depthTexture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.DEPTH_COMPONENT16,
			this.gl.canvas.width,
			this.gl.canvas.height,
			0,
			this.gl.DEPTH_COMPONENT,
			this.gl.UNSIGNED_SHORT,
			null,
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		const frameBuffer = this.gl.createFramebuffer() as WebGLFramebuffer;
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, colorTexture, 0);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1, this.gl.TEXTURE_2D, normalTexture, 0);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, depthTexture, 0);

		this.gl.drawBuffers([
			this.gl.COLOR_ATTACHMENT0 /* gl_FragData[0] */,
			this.gl.COLOR_ATTACHMENT1 /* gl_FragData[1] */,
		]);
		this.frameBufferInfo = {
			framebuffer: frameBuffer!,
			textures: [colorTexture!, normalTexture!, depthTexture!],
		};
	}

	initGradient() {
		this.gl.useProgram(this.programInfo2!.program);
		const gradTexture = this.gl.createTexture();
		const color = new Uint8Array(3 * 512);
		initColor(color, this.model.currentMinWeight, this.model.currentMaxWeight);
		this.gl.activeTexture(this.gl.TEXTURE2);
		this.gl.bindTexture(this.gl.TEXTURE_2D, gradTexture);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 512, 1, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, color);
		this.gl.uniform1i(this.programInfo2!.uniformLocations.grad_Sampler, 2);
	}

	initTimeTexture() {
		this.gl.useProgram(this.programInfo1!.program);

		let maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
		let texturesCount = Math.ceil(this.model.countOfTriangles / maxTextureSize);
		let countOfTrInLayer = this.model.countOfTriangles / texturesCount;

		let weightTexture = this.gl.createTexture();
		this.gl.activeTexture(this.gl.TEXTURE3);
		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, weightTexture);

		this.gl.texStorage3D(
			this.gl.TEXTURE_2D_ARRAY,
			1,
			this.gl.RGB32F,
			countOfTrInLayer,
			this.model.time.timePointsSize,
			texturesCount,
		);

		const array = new Float32Array(this.model.weightArray);

		this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		//this.gl.pixelStorei(this.gl.UNPACK_ROW_LENGTH, this.model.countOfTriangles);

		for (let t = 0; t < this.model.time.timePointsSize; t++) {
			const yoff = t * this.model.countOfTriangles;
			for (let d = 0; d < texturesCount; d++) {
				const xoff = (yoff + d * countOfTrInLayer) * 3;

				//this.gl.pixelStorei(this.gl.UNPACK_SKIP_PIXELS, xoff);
				//this.gl.pixelStorei(this.gl.UNPACK_SKIP_ROWS, t);

				this.gl.texSubImage3D(
					this.gl.TEXTURE_2D_ARRAY,
					0,
					0,
					t,
					d,
					countOfTrInLayer,
					1,
					1,
					this.gl.RGB,
					this.gl.FLOAT,
					array.slice(xoff, xoff + countOfTrInLayer * 3),
				);
			}
		}

		// for (let d = 0; d < texturesCount; ++d) {
		// 	const xoff = d  * width;
		// 	const yoff = (d / 4 | 0) * height;
		// 	// Tell WebGL where to start copying from
		// 	this.gl.pixelStorei(this.gl.UNPACK_SKIP_PIXELS, xoff);
		// 	this.gl.pixelStorei(this.gl.UNPACK_SKIP_ROWS, yoff);
		// 	const level = 0;
		// 	this.gl.texSubImage3D(this.gl.TEXTURE_2D_ARRAY, level, 0, 0, d, width, height, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
		//   }
		//this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);

		// this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		// this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		// this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		// this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		// this.gl.texSubImage3D(
		// 	this.gl.TEXTURE_2D_ARRAY,
		// 	0,
		// 	0 /*this.model.countOfTriangles*/,
		// 	0,
		// 	0,
		// 	countOfTrInLayer,
		// 	1 /*this.model.time.timePointsSize*/,
		// 	texturesCount,
		// 	this.gl.RGB,
		// 	this.gl.FLOAT,
		// 	new Float32Array(this.model.weightArray),
		// );
	}

	initEventHandlers() {
		this.canvas.onmousedown = this.onMouseDown.bind(this);
		this.canvas.onmouseup = this.onMouseUp.bind(this);
		this.canvas.onmousemove = this.onMouseMove.bind(this);
		this.canvas.onwheel = this.onMouseWheel.bind(this);
	}

	onMouseDown(e: MouseEvent) {
		var x = e.clientX,
			y = e.clientY;
		var rect = (<Element>e.target).getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			this.lastCoord = { lastX: x, lastY: y };
			this.dragging = true;
		}
		this.rendering();
	}

	onMouseUp(e: MouseEvent) {
		this.dragging = false;
		this.rendering();
	}

	onMouseMove(e: MouseEvent) {
		var x = e.clientX,
			y = e.clientY;
		if (this.dragging) {
			var factor = 100 / this.canvas.height / 10;
			var dx = factor * (x - this.lastCoord.lastX);
			var dy = factor * (y - this.lastCoord.lastY);

			this.currentAngle[0] = /* this.currentAngle[0] + dy; */ Math.max(
				Math.min(this.currentAngle[0] + dy, 90.0),
				-90.0,
			);
			this.currentAngle[1] = this.currentAngle[1] + dx;
		}
		this.lastCoord = { lastX: x, lastY: y };
		this.rendering();
	}

	onMouseWheel(e: WheelEvent) {
		let delta = 0;
		if (e.deltaY) {
			delta = e.deltaY / 120;
		} else if (e.detail) {
			delta = -e.detail / 3;
		}
		if (delta) {
			if (e.preventDefault) e.preventDefault();

			if (delta > 0) {
				this.scale += 0.2;
			} else {
				this.scale += -0.2;
			}
		}
		this.rendering();
	}

	/*FPSCounter(then: number, fps: number, counter: number) {
		let now = performance.now();
		let duration = now - then;

		if (duration < 1000) {
			counter++;
		} else {
			fps = counter;
			counter = 0;
			then = now;
			this.fpsCounter.innerHTML = fps.toString();
		}
	}*/

	rendering() {
		let frameCount = function _fc(then: number, fps: number, counter: number) {
			let now = performance.now();
			let duration = now - then;

			if (duration < 1000) {
				counter++;
			} else {
				fps = counter;
				counter = 0;
				then = now;
				document.getElementById('count')!.innerHTML = fps.toString();
			}
			requestAnimationFrame(() => frameCount(then, fps, counter));
		};

		let pass: number;
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBufferInfo!.framebuffer);
		//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		pass = 1;
		this.run(pass);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		pass = 2;
		this.run(pass);

		frameCount(performance.now(), 0, 0);
	}

	run(pass: number) {
		this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		// Near things obscure far things
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		const fieldOfView = (45 * Math.PI) / 180;
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		const pMatrix = mat4.create();
		mat4.perspective(pMatrix, fieldOfView, this.gl.canvas.width / this.gl.canvas.height, 0.1, 100.0);

		const mvMatrix = mat4.create();
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -10.0]);

		this.drawScene(pass, mvMatrix, pMatrix);
	}
	mvMatrixStack = new Array();

	drawScene(pass: number, mvMatrix: mat4, pMatrix: mat4) {
		let countOfTriangles = 0;
		if (this.model.currentMaterialIndex == -1)
			this.model.materials.forEach(material => {
				countOfTriangles += material.countOfTriangles;
			});
		else countOfTriangles = this.model.materials[this.model.currentMaterialIndex].countOfTriangles;

		let glCoordNormalIndex = 0,
			localCoordIndex = 0,
			triangleIndex = 0;

		for (let i = 0; i < this.model.currentMaterialIndex; i++) {
			glCoordNormalIndex +=
				this.model.materials[i].countOfTriangles * this.model.vertCountInTriangle * this.model.coordinateSystem;
			triangleIndex += this.model.materials[i].countOfTriangles * this.model.vertCountInTriangle;
			localCoordIndex +=
				this.model.materials[i].countOfTriangles * this.model.vertCountInTriangle * (this.model.coordinateSystem - 1);
		}
		let copy = mat4.create();
		copy.set(mvMatrix);
		//  mat4.set(mvMatrix, copy);
		this.mvMatrixStack.push(copy);

		mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, this.scale]);
		mat4.rotate(mvMatrix, mvMatrix, this.currentAngle[0], [1.0, 0.0, 0.0]); /* ось X */
		mat4.rotate(mvMatrix, mvMatrix, this.currentAngle[1], [0.0, 1.0, 0.0]); /* ось Y */

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameBufferInfo!.textures[0]);
		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameBufferInfo!.textures[1]);

		if (pass == 1) {
			this.gl.useProgram(this.programInfo1!.program);

			this.gl.uniform1f(
				this.programInfo1!.uniformLocations.minSolution,
				(this.model.currentMinWeight - this.model.minWeight) / (this.model.maxWeight - this.model.minWeight),
			);
			this.gl.uniform1f(
				this.programInfo1!.uniformLocations.maxSolution,
				(this.model.currentMaxWeight - this.model.minWeight) / (this.model.maxWeight - this.model.minWeight),
			);
			let currentTimeIndex = this.model.time.currentTimeIndex / this.model.time.timePointsSize;
			this.gl.uniform1f(this.programInfo1!.uniformLocations.timeIndex, currentTimeIndex);

			this.gl.uniform1f(this.programInfo1!.uniformLocations.countOfTrianglesInLayer, 12896.0);

			this.gl.uniform1i(this.programInfo1!.uniformLocations.weightTime_Sampler, 3);

			this.gl.enableVertexAttribArray(this.programInfo1!.attribLocations.a_vertexPosition);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers!.globalCoords);
			this.gl.vertexAttribPointer(
				this.programInfo1!.attribLocations.a_vertexPosition,
				3,
				this.gl.FLOAT,
				false,
				4 * 3,
				4 * glCoordNormalIndex,
			);

			this.gl.enableVertexAttribArray(this.programInfo1!.attribLocations.a_triangleIndeces);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers!.triangleIndeces);
			this.gl.vertexAttribPointer(
				this.programInfo1!.attribLocations.a_triangleIndeces,
				1,
				this.gl.FLOAT,
				false,
				4 * 1,
				4 * triangleIndex,
			);

			this.gl.enableVertexAttribArray(this.programInfo1!.attribLocations.a_localNumbers);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers!.localCoords);
			this.gl.vertexAttribPointer(
				this.programInfo1!.attribLocations.a_localNumbers,
				2,
				this.gl.FLOAT,
				false,
				4 * 2,
				4 * localCoordIndex,
			);

			this.gl.enableVertexAttribArray(this.programInfo1!.attribLocations.a_normals);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers!.normals);
			this.gl.vertexAttribPointer(
				this.programInfo1!.attribLocations.a_normals,
				3,
				this.gl.FLOAT,
				false,
				4 * 3,
				4 * glCoordNormalIndex,
			);

			this.setMatrixUniforms(this.programInfo1 as ShaderProgramInfo, mvMatrix, pMatrix);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, countOfTriangles * this.model.vertCountInTriangle);
		}
		if (pass == 2) {
			this.gl.useProgram(this.programInfo2!.program);

			this.gl.uniform1i(this.programInfo2!.uniformLocations.color_Sampler, 0);
			this.gl.uniform1i(this.programInfo2!.uniformLocations.normal_Sampler, 1);
			this.gl.uniform2f(this.programInfo2!.uniformLocations.canvasSize, this.canvas.width, this.canvas.height);
			this.gl.uniform1i(this.programInfo2!.uniformLocations.countOfLines, this.countOfLines);
			this.gl.uniform1i(this.programInfo2!.uniformLocations.thickness, this.thicknessValue);
			this.gl.uniform1i(this.programInfo2!.uniformLocations.useWhiteMode, this.useWhiteMode);

			let min = (this.model.currentMinWeight - this.model.minWeight) / (this.model.maxWeight - this.model.minWeight);
			let max = (this.model.currentMaxWeight - this.model.minWeight) / (this.model.maxWeight - this.model.minWeight);
			this.gl.uniform1f(this.programInfo2!.uniformLocations.minSolution, min);
			this.gl.uniform1f(this.programInfo2!.uniformLocations.maxSolution, max);

			this.gl.enableVertexAttribArray(this.programInfo2!.attribLocations.a_vertexPosition);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers!.globalCoords);
			this.gl.vertexAttribPointer(
				this.programInfo2!.attribLocations.a_vertexPosition,
				3,
				this.gl.FLOAT,
				false,
				4 * 3,
				4 * glCoordNormalIndex,
			);
			this.setMatrixUniforms(this.programInfo2 as ShaderProgramInfo, mvMatrix, pMatrix);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, countOfTriangles * this.model.vertCountInTriangle);
		}
		if (this.mvMatrixStack.length == 0) throw 'Invalid popMatrix!';
		mvMatrix = this.mvMatrixStack.pop();
		//popMatrix(mvMatrix, initialmvMatrix);
	}
	setMatrixUniforms(programInfo: ShaderProgramInfo, mvMatrix: mat4, pMatrix: mat4) {
		this.gl.uniformMatrix4fv(programInfo!.uniformLocations.pMatrixUniform!, false, pMatrix);
		this.gl.uniformMatrix4fv(programInfo!.uniformLocations.mvMatrixUniform, false, mvMatrix);
	}

	onChangeTrackBar() {
		this.countOfLines = parseFloat((<HTMLInputElement>document.getElementById('trackbar')).value);
		(<HTMLElement>document.getElementById('trackBarValue')).innerHTML = this.countOfLines.toString();
		this.rendering();
	}

	onChangeThicknessTrackBar() {
		this.thicknessValue = parseFloat((<HTMLInputElement>document.getElementById('th_trackbar')).value);
		(<HTMLImageElement>document.getElementById('pic')).width = 1.5 * this.thicknessValue;
		this.rendering();
	}

	onKeyDownMinValue(e: KeyboardEvent) {
		if (e.keyCode == 13) {
			this.model.currentMinWeight = parseFloat((<HTMLInputElement>document.getElementById('minValue')).value);
			this.initGradient();
			this.rendering();
		}
	}

	onKeyDownMaxValue(e: KeyboardEvent) {
		if (e.keyCode == 13) {
			this.model.currentMaxWeight = parseFloat((<HTMLInputElement>document.getElementById('maxValue')).value);
			this.initGradient();
			this.rendering();
		}
	}

	onClickAutoButton() {
		this.model.currentMaxWeight = this.model.maxWeight;
		this.model.currentMinWeight = this.model.minWeight;
		(<HTMLInputElement>document.getElementById('maxValue')).value = this.model.currentMaxWeight.toString();
		(<HTMLInputElement>document.getElementById('minValue')).value = this.model.currentMinWeight.toString();
		this.initGradient();
		this.rendering();
	}

	onClickChangeColorButton() {
		if (this.useWhiteMode) this.useWhiteMode = 0;
		else this.useWhiteMode = 1;
		this.rendering();
	}

	onSelectMaterial() {
		this.model.currentMaterialIndex = parseInt((<HTMLSelectElement>document.getElementById('selectMaterial')).value);
		this.rendering();
	}

	async onSelectSolution() {
		this.model.currentSolutionIndex = parseInt(
			(<HTMLSelectElement>document.getElementById('selectTypeSolution')).value,
		);
		if (this.model.currentSolutionIndex >= this.model.countOfScalarSolutions) {
			(<HTMLSelectElement>document.getElementById('selectComponent')).disabled = false;
			if ((<HTMLSelectElement>document.getElementById('selectComponent')).options.length == 0) {
				this.model.currentComponentIndex = 0;
				(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('X', '0', true, true));
				(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('Y', '1', false, false));
				(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('Z', '2', false, false));
			}
		} else {
			(<HTMLSelectElement>document.getElementById('selectComponent')).disabled = true;
			(<HTMLSelectElement>document.getElementById('selectComponent')).options.length = 0;
		}
		await this.model.formCurrentSolution();
		(<HTMLInputElement>document.getElementById('minValue')).value = this.model.currentMinWeight.toString();
		(<HTMLInputElement>document.getElementById('maxValue')).value = this.model.currentMaxWeight.toString();
		this.initGradient();
		this.initTimeTexture();
		this.rendering();
	}

	async onSelectComponent() {
		this.model.currentComponentIndex = parseInt((<HTMLSelectElement>document.getElementById('selectComponent')).value);
		await this.model.formCurrentSolution();
		(<HTMLInputElement>document.getElementById('minValue')).value = this.model.currentMinWeight.toString();
		(<HTMLInputElement>document.getElementById('maxValue')).value = this.model.currentMaxWeight.toString();
		this.initGradient();
		this.initTimeTexture();
		this.rendering();
	}

	onChangeTimeTrackBar() {
		this.model.time.currentTimeIndex = parseFloat((<HTMLInputElement>document.getElementById('time_trackbar')).value);
		(<HTMLInputElement>document.getElementById('timeValue')).value = this.model.time.timePoints[
			this.model.time.currentTimeIndex
		].toString();
		this.rendering();
	}

	async onClickPlayButton() {
		let currentTimeIndex = this.model.time.currentTimeIndex;
		(<HTMLInputElement>document.getElementById('timeValue')).readOnly = true;
		(<HTMLInputElement>document.getElementById('time_trackbar')).disabled = true;
		for (let i = 0; i < this.model.time.timePointsSize; i++) {
			this.model.time.currentTimeIndex = i;
			(<HTMLInputElement>document.getElementById('timeValue')).value = this.model.time.timePoints[
				this.model.time.currentTimeIndex
			].toString();
			this.rendering();
			await this.sleep(50);
		}
		await this.sleep(200);
		this.model.time.currentTimeIndex = currentTimeIndex;
		(<HTMLInputElement>document.getElementById('timeValue')).readOnly = false;
		(<HTMLInputElement>document.getElementById('time_trackbar')).disabled = false;
		(<HTMLInputElement>document.getElementById('timeValue')).value = this.model.time.timePoints[
			this.model.time.currentTimeIndex
		].toString();
		this.onChangeTimeTrackBar();
	}

	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	onKeyDownTimeValue(e: KeyboardEvent) {
		if (e.keyCode == 13) {
			let currentTimePoint = parseFloat((<HTMLInputElement>document.getElementById('timeValue')).value);
			this.formTimeValue(currentTimePoint);
			(<HTMLInputElement>document.getElementById('time_trackbar')).value = this.model.time.currentTimeIndex.toString();
			this.rendering();
		}
	}

	formTimeValue(currentTimePoint: number) {
		if (this.model.time.timePoints.indexOf(currentTimePoint) == -1) {
			let neighbourIndeces = dichotomyMethod(this.model.time.timePoints, currentTimePoint);
			let leftTimePoint = this.model.time.timePoints[neighbourIndeces[0]];
			let rightTimePoint = this.model.time.timePoints[neighbourIndeces[1]];
			let a = currentTimePoint - leftTimePoint;
			let b = rightTimePoint - leftTimePoint;
			this.model.time.currentTimeIndex = neighbourIndeces[0] + a / b;
		} else this.model.time.currentTimeIndex = this.model.time.timePoints.indexOf(currentTimePoint);
	}
}
