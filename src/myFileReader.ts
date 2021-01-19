// import { Model } from '../src/model';
// import { Material } from '../src/material';
// import { Triangle } from '../src/triangle';
// import { plainToClass } from 'class-transformer';
// import { Time } from '../src/time';

// export class MyFileReader {
// 	model: Model;

// 	constructor() {
// 		this.model = new Model();
// 	}

// 	ReadJSONFile(fileContent: string) {
// 		const jsonObj = JSON.parse(fileContent) as Object;
// 		//this.model.time = plainToClass(Time, jsonObj);
// 		this.model = plainToClass(Model, jsonObj);
// 		this.model.materials = plainToClass(Material, this.model.materials);

// 		this.model.materials.forEach(material => {
// 			material.triangles = plainToClass(Triangle, material.triangles);
// 		});
// 		this.model.time = plainToClass(Time, this.model.time);
// 		this.model.time.initTimeValues();
// 		this.model.findMinMaxWeight();
// 		this.model.recalculateWeight();
// 		this.model.initOriginalValues();
// 		this.model.formLocalCoords();
// 	}

// 	readFileContent(e: Event) {
// 		let file = (<HTMLInputElement>e!.target)!.files![0];
// 		/* ��� ������������ ��������� ���� � ������� ������ ��� ������ ��� ������� ������ */
// 		const outputElement = <HTMLOutputElement>document.getElementById('output1');
// 		const reader = new FileReader();
// 		/* ���������� � ����� ��� ����� */
// 		const fileName = file.name.replace(/\\/g, '/').split('/').pop();
// 		/* ������ ���������� ����� */
// 		const fileExtension = fileName && fileName.split('.').pop();
// 		outputElement.innerHTML = 'Name of file: ' + fileName;

// 		return new Promise(resolve => {
// 			/* ������������� ���������� ������� onload. ��� ��������� �� ��������� ������ ����� */
// 			reader.onload = ((e: Event) => {
// 				/* e.target.textContent/reader.result �������� �� ���������� ����� */
// 				const fileContent = reader.result as string | ArrayBuffer;
// 				switch (fileExtension) {
// 					case 'json':
// 						this.ReadJSONFile(fileContent as string);
// 						break;
// 					default:
// 						alert('ERROR: this file extension is not supported!');
// 						return;
// 				}
// 				resolve();
// 			}).bind(this);
// 			if (fileExtension == 'json') reader.readAsText(file);
// 		});
// 	}
// }
