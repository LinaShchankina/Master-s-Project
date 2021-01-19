export const fsSource1 = `#version 300 es
    /* средняя точность представления данных, требуется во фрагментных шейдерах, float (-2в14,2в14) */
    precision highp float;
    precision highp sampler2DArray;

    in vec3 v_Normals;
    in vec2 v_LocalNumbers;
    in vec3 v_Position;
    in float v_triangleIndex;

    uniform float uMinSolution;
    uniform float uMaxSolution;
    uniform float uTimeIndex;
    uniform float uCountOfTriangles;

    uniform sampler2DArray weightTime_Sampler;

    layout(location = 0) out vec4 fragData0;
    layout(location = 1) out vec4 fragData1;

    void main(void) 
    {
        float textureLayer = floor(v_triangleIndex / uCountOfTriangles);
        float triangleIndex = (v_triangleIndex - textureLayer * uCountOfTriangles) / uCountOfTriangles;

        vec4 weight = texture(weightTime_Sampler, vec3(triangleIndex, uTimeIndex, textureLayer));
        vec4 weight2 = vec4((weight.r + weight.g) / 2.0, (weight.g + weight.b) / 2.0, (weight.r + weight.b) / 2.0, 1.0);

        float y1 = 0.;
        float y2 = 1.;
        float y3 = 0.;
        float x1 = 1.;
        float x2 = 0.;
        float x3 = 0.;

        float a = y3 - y2;  //y3-y2
        float b = y3 - y1;  //y3-y1
        float c = y2 - y1;  //y2-y1

        float d = x3 - x2;  //x3-x2
        float e = x3 - x1;	//x3-x1
        float f = x2 - x1;	//x2-x1

        float u = 0.;
        float detD = abs(f * b - e * c);

        vec3 L = vec3(
            abs(d*(v_LocalNumbers[1] - y2) - a * (v_LocalNumbers[0] - x2))/detD,
            abs(b*(v_LocalNumbers[0] - x3) - e * (v_LocalNumbers[1] - y3))/detD,
            abs(f*(v_LocalNumbers[1] - y1) - c * (v_LocalNumbers[0] - x1))/detD
            );

        mat3 phi = mat3(
            vec3(L[0] * (2. * L[0] - 1.), L[1] * (2. * L[1] - 1.), L[2] * (2. * L[2] - 1.)),
            vec3( 4. * L[0] * L[1], 4. * L[1] * L[2], 4. * L[0] * L[2]),
            vec3( 0., 0., 0.)
            );

        for (int i = 0; i < 3; i++)
            u += (weight[i] * phi[0][i]) + (weight2[i] * phi[1][i]);

        if (u >= uMinSolution && u <= uMaxSolution) {
            u = (u - uMinSolution) / (uMaxSolution - uMinSolution);
            if (u <= 10e-3) u = 10e-3;
            if (u >= 1.0 - 10e-3) u = 1.0 - 10e-3;

            fragData0 = vec4(u, u, u, 1.0);
        }
        else if (u > uMaxSolution)
                fragData0 = vec4(1.0 - 10e-3, 1.0 - 10e-3, 1.0 - 10e-3, 0.0);
            else
                fragData0 = vec4(10e-3, 10e-3, 10e-3, 0.0);

        fragData1 = vec4(0.33 * (vec3(1, 1, 1) + v_Normals + v_Position), 1);
    }`;
