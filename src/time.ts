import { ServerApi } from './serverConnection';

export class Time {
	timePointsSize: number;
	timePoints: number[];
	currentTimeIndex: number;
	timePlayIndex: number;

	constructor() {
		this.timePointsSize = 0;
		this.timePlayIndex = 0;
		this.currentTimeIndex = 0;

		this.timePoints = new Array();
	}

	async formTimeMesh(problemName: string) {
		let jsonObiect = await ServerApi.getTimeMesh(problemName);
		for (let i = 0; i < jsonObiect.length; i++) this.timePoints[i] = jsonObiect[i];
		this.timePointsSize = this.timePoints.length;
	}

	initTimeValues() {
		this.timePointsSize = this.timePoints.length;
		(<HTMLInputElement>document.getElementById('time_trackbar')).value = this.timePoints[0].toString();
		(<HTMLElement>document.getElementById('time_trackBarValue')).innerHTML =
			'[' + this.timePoints[0].toString() + ',...,' + this.timePoints[this.timePointsSize - 1].toString() + ']';
		(<HTMLInputElement>document.getElementById('time_trackbar')).min = '0'; //this.timePoints[0].toFixed(7).toString();
		(<HTMLInputElement>document.getElementById('time_trackbar')).max = (this.timePointsSize - 1).toString();
		(<HTMLInputElement>document.getElementById('timeValue')).value = this.timePoints[0].toString();
		(<HTMLInputElement>document.getElementById('timeValue')).min = this.timePoints[0].toString();
		(<HTMLInputElement>document.getElementById('timeValue')).max = this.timePoints[this.timePointsSize - 1].toString();

		this.currentTimeIndex = 0;
	}
}
