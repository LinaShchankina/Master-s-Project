import { Material } from '../src/material';
import { Time } from './time';
import { ServerApi } from './serverConnection';
import { Normalizer } from './normalizer';

export class Model {
	weightArray: number[];

	countOfTriangles: number;

	weightCountInTriangle: number;

	problem: string;
	solutions: string[];

	coordinateSystem: number;
	vertCountInTriangle: number;
	countOfMaterials: number;
	countOfScalarSolutions: number;
	countOfVectorSolutions: number;
	materials: Material[];

	currentMaterialIndex: number;
	currentSolutionIndex: number;

	allGlobalCoords: number[];
	currentComponentIndex: number;

	coordsOfCurrentMaterial: number[][][];
	maxWeight: number;
	minWeight: number;
	currentMinWeight: number;
	currentMaxWeight: number;

	time: Time;

	constructor() {
		this.weightArray = new Array();

		this.countOfTriangles = 0;
		this.weightCountInTriangle = 3;
		this.coordinateSystem = 3;
		this.vertCountInTriangle = 3;
		this.countOfMaterials = 0;
		this.countOfScalarSolutions = 0;
		this.countOfVectorSolutions = 0;

		this.coordsOfCurrentMaterial = new Array();
		this.currentMaterialIndex = -1;
		this.currentSolutionIndex = 0;
		this.currentComponentIndex = 0;

		this.allGlobalCoords = new Array();

		this.materials = new Array();
		this.time = new Time();
		this.solutions = new Array();
		this.problem = '';

		this.maxWeight = 0;
		this.minWeight = 0;
		this.currentMaxWeight = 0;
		this.currentMinWeight = 0;
	}

	initOriginalValues() {
		(<HTMLSelectElement>document.getElementById('selectMaterial')).options.add(new Option('All', '-1', true, true));
		for (let i = 0; i < this.countOfMaterials; i++)
			(<HTMLSelectElement>document.getElementById('selectMaterial')).options.add(
				new Option(this.materials[i].nameOfMaterial, i.toString(), false, false),
			);

		(<HTMLInputElement>document.getElementById('minValue')).value = this.currentMinWeight.toString();
		(<HTMLInputElement>document.getElementById('maxValue')).value = this.currentMaxWeight.toString();

		(<HTMLSelectElement>document.getElementById('selectTypeSolution')).options.add(
			new Option(this.solutions[this.currentSolutionIndex], '0', true, true),
		);
		for (let i = 1; i < this.solutions.length; i++)
			(<HTMLSelectElement>document.getElementById('selectTypeSolution')).options.add(
				new Option(this.solutions[i], i.toString(), false, false),
			);

		if (this.currentSolutionIndex >= this.countOfScalarSolutions) {
			(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('X', '0', true, true));
			(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('Y', '1', false, false));
			(<HTMLSelectElement>document.getElementById('selectComponent')).options.add(new Option('Z', '2', false, false));
			(<HTMLSelectElement>document.getElementById('selectComponent')).disabled = false;
		} else (<HTMLSelectElement>document.getElementById('selectComponent')).disabled = true;
	}

	async formModel() {
		await this.time.formTimeMesh(this.problem);
		await this.formMaterials();
		await this.formSolutions();
		this.time.initTimeValues();
	}

	findMinMaxWeight(weightArray: number[]) {
		this.currentMinWeight = this.minWeight = this.getMin(weightArray);
		this.currentMaxWeight = this.maxWeight = this.getMax(weightArray);
	}

	normalizeWeight(weightArray: number[]) {
		let normalizer = new Normalizer(this.maxWeight, this.minWeight);
		for (let j = 0; j < weightArray.length; j++) weightArray[j] = normalizer.normalize(weightArray[j]);
	}

	async formMaterials() {
		let jsonObiect: any = await ServerApi.getMaterials(this.problem);
		for (let i = 0; i < jsonObiect.length; i++) {
			this.materials[i] = new Material();
			this.materials[i].nameOfMaterial = jsonObiect[i];
		}
		this.countOfMaterials = this.materials.length;
	}

	async formSolutions() {
		this.solutions = await ServerApi.getScalarNames(this.problem);
		this.countOfScalarSolutions = this.solutions.length;

		this.solutions = this.solutions.concat(await ServerApi.getVectorNames(this.problem));
		this.countOfVectorSolutions = this.solutions.length - this.countOfScalarSolutions;
	}

	async formMaterialMesh() {
		let allNormals = new Array();
		let allLocalCoords = new Array();

		for (let i = 0; i < this.countOfMaterials; i++) {
			this.coordsOfCurrentMaterial[i] = new Array();
			let ind = 0;
			let jsonObiect = await ServerApi.getMaterialMesh(this.problem, this.materials[i].nameOfMaterial);
			for (let j = 0; j < jsonObiect.length; j++) {
				for (let s = 0; s < jsonObiect[j].triangles.length; s++) {
					for (let k = 0; k < this.vertCountInTriangle; k++) {
						this.coordsOfCurrentMaterial[i].push(new Array(this.coordinateSystem));
						for (let l = 0; l < this.coordinateSystem; l++) {
							this.allGlobalCoords.push(jsonObiect[j].triangles[s].vertices[k][l]);
							this.coordsOfCurrentMaterial[i][ind][l] = jsonObiect[j].triangles[s].vertices[k][l];
							allNormals.push(jsonObiect[j].triangles[s].normals[k][l]);
						}
						ind++;
					}
					allLocalCoords.push(1, 0, 0, 1, 0, 0);
				}
				this.materials[i].countOfTriangles += jsonObiect[j].triangles.length;
			}
			this.countOfTriangles += this.materials[i].countOfTriangles;
		}
		return [this.allGlobalCoords, allNormals, allLocalCoords];
	}

	async formCurrentSolution() {
		this.weightArray.length = 0;
		if (this.currentSolutionIndex < this.countOfScalarSolutions) return await this.formScalarWeight();
		else return await this.formVectorWeight();
	}

	async formScalarWeight() {
		let weightArray2 = new Array();
		let weightArray1 = new Array();
		//this.time.timePointsSize = 2;
		for (let t = 0; t < this.time.timePointsSize; t++) {
			for (let i = 0; i < this.countOfMaterials; i++) {
				let postObject = new Array();
				let currentDataServer = new DataServer(this.time.timePoints[t], this.materials[i].nameOfMaterial);
				currentDataServer.points = this.coordsOfCurrentMaterial[i];
				postObject.push(currentDataServer);

				weightArray1 = await ServerApi.postScalarWeight(
					this.problem,
					encodeURIComponent(this.solutions[this.currentSolutionIndex]),
					JSON.stringify(postObject),
				);
				this.weightArray = this.weightArray.concat(weightArray1);
			}
		}
		this.findMinMaxWeight(this.weightArray);
		this.normalizeWeight(this.weightArray);

		for (let y = 0; y < this.weightArray.length; y++)
			for (let x = 0; x < 3; x++) weightArray2.push(this.weightArray[y]);

		return weightArray2;
	}

	getMax(arr: number[]) {
		let len = arr.length;
		let max = -Infinity;

		while (len--) {
			max = arr[len] != null && arr[len] > max ? arr[len] : max;
		}
		return max;
	}

	getMin(arr: number[]) {
		let len = arr.length;
		let min = Infinity;

		while (len--) {
			min = arr[len] != null && arr[len] < min ? arr[len] : min;
		}
		return min;
	}

	formArrayOfTriangles() {
		let trianglesArray = new Array();
		for (let i = 0; i < this.countOfTriangles; i++)
			for (let j = 0; j < this.vertCountInTriangle; j++) {
				if (j == 0) trianglesArray.push(i);
				if (j == 1) trianglesArray.push(i + 1 / 3);
				if (j == 1) trianglesArray.push(i + 2 / 3);
			}
		return trianglesArray;
	}

	async formVectorWeight() {
		let weightArray2 = new Array();
		let weightArray1 = new Array<number[]>();
		//this.time.timePointsSize = 2;
		for (let t = 0; t < this.time.timePointsSize; t++) {
			for (let i = 0; i < this.countOfMaterials; i++) {
				let postObject = new Array();
				let currentDataServer = new DataServer(this.time.timePoints[t], this.materials[i].nameOfMaterial);
				currentDataServer.points = this.coordsOfCurrentMaterial[i];
				postObject.push(currentDataServer);

				weightArray1 = await ServerApi.postVectorWeight(
					this.problem,
					encodeURIComponent(this.solutions[this.currentSolutionIndex]),
					JSON.stringify(postObject),
				);
				weightArray1.forEach(x => {
					let [elem] = x.filter((elem, index) => index % 3 === this.currentComponentIndex);
					this.weightArray.push(elem);
				});
			}
		}
		this.findMinMaxWeight(this.weightArray);
		this.normalizeWeight(this.weightArray);

		for (let y = 0; y < this.weightArray.length; y++)
			for (let x = 0; x < 3; x++) weightArray2.push(this.weightArray[y]);

		return weightArray2;
	}

	calculateMiddleCoords(globalCoords: number[][]) {
		for (let i = 0; i < this.vertCountInTriangle; i++) {
			globalCoords.push(new Array());
			for (let j = 0; j < this.coordinateSystem; j++)
				globalCoords[i + 3].push((globalCoords[i][j] + globalCoords[(i + 1) % this.vertCountInTriangle][j]) / 2);
		}
		return globalCoords;
	}
}

class DataServer {
	time: number;
	material: string;
	points: number[][];

	constructor(time: number, material: string) {
		this.time = time;
		this.material = material;
		this.points = new Array();
	}
}
