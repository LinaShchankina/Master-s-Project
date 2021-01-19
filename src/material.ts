import { Triangle } from './triangle';

export class Material {
	nameOfMaterial: string;

	countOfTriangles: number;
	triangles: Triangle[];
	equalLinesCoords: number[];

	constructor() {
		this.nameOfMaterial = '';

		this.countOfTriangles = 0;
		this.triangles = new Array();
		this.equalLinesCoords = new Array();
	}
}
