import { isNull } from 'util';

export class QuadraticBasis {
	countOfBFinTriangle: number;
	countOfLcoordinates: number;
	Lcoordinates: number[];
	phi: number[];

	constructor() {
		this.countOfLcoordinates = 3;
		this.countOfBFinTriangle = 6;
		this.Lcoordinates = new Array(this.countOfLcoordinates);
		this.phi = new Array(this.countOfBFinTriangle);
	}

	getLocalCoordOnEdge(u: number, weightOnEdge: number[]) {
		let eps = 1e-10;
		const a = 2 * weightOnEdge[0] - 4 * weightOnEdge[2] + 2 * weightOnEdge[1];
		const b = -3 * weightOnEdge[0] + 4 * weightOnEdge[2] - weightOnEdge[1];
		const c = weightOnEdge[0];

		let ksi = 0;

		if (a > -eps && a < eps) ksi = (u - c) / b;
		else {
			let discriminant = Math.pow(b, 2) - 4 * a * (c - u);

			ksi = (-b + Math.sqrt(discriminant)) / (2 * a);
			if (ksi < 0 || ksi > 1) ksi = (-b - Math.sqrt(discriminant)) / (2 * a);
		}
		if (!isNull(ksi) && ksi >= 0 && ksi <= 1) return ksi;
		return null;
	}
}
