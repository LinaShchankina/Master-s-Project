import { Drawer } from '../src/drawer';
import { ServerApi } from './serverConnection';

export class Program {
	drawer: Drawer;

	constructor() {
		this.drawer = new Drawer();
	}

	initEventHandlers() {
		(<HTMLInputElement>document.getElementById('dropButton')).onclick = this.inputProblem.bind(this);
		(<HTMLInputElement>document.getElementById('trackbar')).onchange = this.drawer.onChangeTrackBar.bind(this.drawer);
		(<HTMLInputElement>document.getElementById('th_trackbar')).onchange = this.drawer.onChangeThicknessTrackBar.bind(
			this.drawer,
		);
		(<HTMLInputElement>document.getElementById('time_trackbar')).onchange = this.drawer.onChangeTimeTrackBar.bind(
			this.drawer,
		);
		(<HTMLInputElement>document.getElementById('play')).onclick = this.drawer.onClickPlayButton.bind(this.drawer);
		(<HTMLInputElement>document.getElementById('timeValue')).onkeydown = this.drawer.onKeyDownTimeValue.bind(
			this.drawer,
		);
		(<HTMLInputElement>document.getElementById('minValue')).onkeydown = this.drawer.onKeyDownMinValue.bind(this.drawer);
		(<HTMLInputElement>document.getElementById('maxValue')).onkeydown = this.drawer.onKeyDownMaxValue.bind(this.drawer);
		(<HTMLInputElement>document.getElementById('auto')).onclick = this.drawer.onClickAutoButton.bind(this.drawer);
		(<HTMLInputElement>document.getElementById('changeColorMode')).onclick = this.drawer.onClickChangeColorButton.bind(
			this.drawer,
		);
		(<HTMLSelectElement>document.getElementById('selectMaterial')).onchange = this.drawer.onSelectMaterial.bind(
			this.drawer,
		);
		(<HTMLSelectElement>document.getElementById('selectTypeSolution')).onchange = this.drawer.onSelectSolution.bind(
			this.drawer,
		);
		(<HTMLSelectElement>document.getElementById('selectComponent')).onchange = this.drawer.onSelectComponent.bind(
			this.drawer,
		);
	}
	async inputProblem() {
		let problems = await ServerApi.getProblems();

		(<HTMLElement>document.getElementById('myDropdown')).classList.toggle('show');

		let div = document.getElementById('myDropdown')!;
		if (div.getElementsByTagName('a').length == 0) {
			for (let i = 0; i < problems.length; i++) {
				var e = document.createElement('a');
				e.onclick = await this.chooseProblem.bind(this, problems[i]);
				e.style.cursor = 'pointer';
				e.appendChild(document.createTextNode(problems[i]));
				div.appendChild(e);
			}
		}
	}

	async chooseProblem(currentProblem: string) {
		let e = event;
		if (!(<Element>e!.target).matches('.dropButton')) {
			var dropdowns = document.getElementsByClassName('dropdown-content');
			var i;
			for (i = 0; i < dropdowns.length; i++) {
				var openDropdown = dropdowns[i];
				if (openDropdown.classList.contains('show')) {
					openDropdown.classList.remove('show');
				}
			}
		}
		(<HTMLElement>document.getElementById('problemName')).innerHTML = currentProblem;
		this.drawer.model.problem = currentProblem;
		await this.inputData();
	}

	async inputData() {
		this.drawer.initShaders();
		await this.drawer.model.formModel();
		await this.drawer.initBuffers();
		this.drawer.model.initOriginalValues();
		this.drawer.initFramebuffer();
		this.drawer.initGradient();
		this.drawer.initTimeTexture();
		this.drawer.initEventHandlers();
		this.drawer.rendering();
	}
}
