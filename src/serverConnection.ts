interface IRequest {
	readonly url: string;
	readonly method: string;
	readonly body: any;
	readonly headers: {};
}

export class ServerApi {
	static serverUrl = 'http://localhost:5000';

	static async getProblems() {
		return this.serverRequest<string[]>({ url: '/api/problems', method: 'GET', body: undefined, headers: {} });
	}
	static async getMaterials(problemName: string) {
		return this.serverRequest<string[]>({
			url: '/api/problems/' + problemName + '/materials',
			method: 'GET',
			body: undefined,
			headers: {},
		});
	}

	static async getMaterialMesh(problemName: string, materialName: string) {
		return this.serverRequest<
			{
				index: number;
				triangles: {
					vertices: number[][];
					normals: number[][];
				}[];
			}[]
		>({
			url: '/api/problems/' + problemName + '/materials/' + materialName + '/mesh',
			method: 'GET',
			body: undefined,
			headers: {},
		});
	}

	static async getTimeMesh(problemName: string) {
		return this.serverRequest<number[]>({
			url: '/api/problems/' + problemName + '/results/times',
			method: 'GET',
			body: undefined,
			headers: {},
		});
	}

	static async getScalarNames(problemName: string) {
		return this.serverRequest<string[]>({
			url: '/api/problems/' + problemName + '/results/scalar',
			method: 'GET',
			body: undefined,
			headers: {},
		});
	}

	static async postScalarWeight(problemName: string, solutionName: string, dataServer: string) {
		return this.serverRequest<number[]>({
			url: '/api/problems/' + problemName + '/results/scalar/' + solutionName,
			method: 'POST',
			body: dataServer,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	static async getVectorNames(problemName: string) {
		return this.serverRequest<string[]>({
			url: '/api/problems/' + problemName + '/results/vector',
			method: 'GET',
			body: undefined,
			headers: {},
		});
	}

	static async postVectorWeight(problemName: string, solutionName: string, dataServer: string) {
		return this.serverRequest<number[][]>({
			url: '/api/problems/' + problemName + '/results/vector/' + solutionName,
			method: 'POST',
			body: dataServer,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	private static async serverRequest<T>(request: IRequest): Promise<T> {
		const response = await fetch(ServerApi.serverUrl + request.url, {
			method: request.method,
			body: request.body,
			headers: request.headers,
		});

		if (response.ok) {
			return (await response.json()) as T;
		} else {
			throw new Error(`SERVER ERROR: ${response.text}`);
		}
	}
}
