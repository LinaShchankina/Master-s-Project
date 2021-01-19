import { Normalizer } from './normalizer';

export class Triangle {
	weight: number[][][];

	globalCoords: number[][];
	localCoords: number[][];
	normals: number[];

	constructor(timePointsSize: number, vertCountInTriangle: number, coordinateSystem: number) {
		this.weight = new Array(timePointsSize);
		for (let j = 0; j < timePointsSize; j++) {
			this.weight[j] = new Array();
		}
		this.globalCoords = new Array(vertCountInTriangle);
		this.localCoords = new Array(vertCountInTriangle);
		for (let i = 0; i < vertCountInTriangle; i++) {
			this.globalCoords[i] = new Array(coordinateSystem);
			this.localCoords[i] = new Array(coordinateSystem - 1);
		}
		this.normals = new Array(coordinateSystem);
	}

	normalizeWeightOfTriangle(
		timeIndex: number,
		weightCountInTriangle: number,
		maxWeight: number[],
		minWeight: number[],
	) {
		let countOfComponents = this.weight[timeIndex].length;
		for (let i = 0; i < countOfComponents; i++) {
			let normalizer = new Normalizer(maxWeight[i], minWeight[i]);
			for (let j = 0; j < weightCountInTriangle; j++)
				this.weight[timeIndex][i][j] = normalizer.normalize(this.weight[timeIndex][i][j]);
		}
	}

	calculateWeightOfTriangle(timeIndex: number) {
		let countOfComponents = this.weight[timeIndex].length;
		for (let i = 0; i < countOfComponents; i++) {
			let currentWeightCount = this.weight[timeIndex][i].length;
			for (let j = 0; j < currentWeightCount; j++)
				this.weight[timeIndex][i].push(
					(this.weight[timeIndex][i][j % currentWeightCount] +
						this.weight[timeIndex][i][(j + 1) % currentWeightCount]) /
						2,
				);
		}
	}
}
