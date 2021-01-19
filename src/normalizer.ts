export class Normalizer {
	max: number = 0;
	min: number = 0;

	constructor(max: number, min: number) {
		this.max = max;
		this.min = min;
	}

	normalize(value: number): number {
		return (value - this.min) / (this.max - this.min);
	}
}
