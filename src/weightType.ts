
export class WeightType {
	value : number | number[] = 0;

	add(x: number, y: number): number;
	add(x: number[], y: number[]): number[];
	add(x: any, y: any): any {
		if (typeof(x) == "number")
			x += y;
		if (Array.isArray(x))
			x.map(function(value, index){ return value + y[index] })
		return x;
	}

	substract(x: number, y: number): number;
	substract(x: number[], y: number[]): number[];
	substract(x: any, y: any): any {
		if (typeof(x) == "number")
			x -= y;
		if (Array.isArray(x))
			x.map(function(value, index){ return value - y[index] })
		return x;
    }
    
    equal(x: number, y: number): number;
	equal(x: number[], y: number[]): number[];
	equal(x: any, y: any): any {
		if (typeof(x) == "number")
			x = y;
		if (Array.isArray(x))
			x.unshift(y);
		return x;
    }

    static compare(x: number, y: number): number;
    static compare(x: number[], y: number[]): number[];
    static compare(x: any, y: any): any {
        if (typeof(x) == "number")
            if (x < y) x = -1;
            else if (x == y) x = 0;
                else x = 1;
        if (Array.isArray(x)) 
            x.map(function(value, index){ 
                if (value < y[index]) return -1;
                else if (value == y[index]) return 0;
                    else return 1; })
        return x;
    }

}