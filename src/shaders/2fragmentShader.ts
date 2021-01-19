export const fsSource2 = `#version 300 es
    precision highp float;

    /* sampler1D - тип данных для 2D текстур */
    uniform sampler2D normal_Sampler;
    uniform sampler2D color_Sampler;
    uniform sampler2D grad_Sampler;

    uniform vec2 canvasSize;
    uniform int countOfLines;
    uniform int thickness;
    
    uniform bool useWhiteMode;

    uniform float uMinSolution;
    uniform float uMaxSolution;

    out vec4 fragColor;

    void main(void) 
    {
        vec2 pos = vec2(gl_FragCoord.x / canvasSize.x, gl_FragCoord.y / canvasSize.y);

        float xInt = 1.0 / canvasSize.x;
        float yInt = 1.0 / canvasSize.y;

        float thickness = float(thickness);
        float count = float(countOfLines + 1);
        /* получаем пиксели свой и соседей */

        vec2 thisPix = pos;
        vec2 befPix = vec2(pos.x - thickness*xInt, pos.y);
        vec2 nextPix = vec2(pos.x + thickness*xInt, pos.y);
        vec2 upPix = vec2(pos.x, pos.y + thickness*yInt);
        vec2 downPix = vec2(pos.x, pos.y - thickness*yInt);
        vec2 befUpPix = vec2(pos.x - thickness*xInt, pos.y + thickness*yInt);
        vec2 befDownPix = vec2(pos.x - thickness*xInt, pos.y - thickness*yInt);
        vec2 nextUpPix = vec2(pos.x + thickness*xInt, pos.y + thickness*yInt);
        vec2 nextDownPix = vec2(pos.x + thickness*xInt, pos.y - thickness*yInt);

        vec4 thisCol = texture(normal_Sampler, thisPix);
        vec4 befCol = texture(normal_Sampler, befPix);
        vec4 nextCol = texture(normal_Sampler, nextPix);
        vec4 upCol = texture(normal_Sampler, upPix);
        vec4 downCol = texture(normal_Sampler, downPix);
        vec4 befUpCol = texture(normal_Sampler, befUpPix);
        vec4 befDownCol = texture(normal_Sampler, befDownPix);
        vec4 nextUpCol = texture(normal_Sampler, nextUpPix);
        vec4 nextDownCol = texture(normal_Sampler, nextDownPix);

        vec4 thisCol2 = texture(color_Sampler, thisPix);
        vec4 befCol2 = texture(color_Sampler, befPix);
        vec4 nextCol2 = texture(color_Sampler, nextPix);
        vec4 upCol2 = texture(color_Sampler, upPix);
        vec4 downCol2 = texture(color_Sampler, downPix);
        vec4 befUpCol2 = texture(color_Sampler, befUpPix);
        vec4 befDownCol2 = texture(color_Sampler, befDownPix);
        vec4 nextUpCol2 = texture(color_Sampler, nextUpPix);
        vec4 nextDownCol2 = texture(color_Sampler, nextDownPix);

        float befDif = dot(thisCol - befCol, thisCol - befCol);
        float nextDif = dot(thisCol - nextCol, thisCol - nextCol);
        float upDif = dot(thisCol - upCol, thisCol - upCol);
        float downDif = dot(thisCol - downCol, thisCol - downCol);
        float befUpDif = dot(thisCol - befUpCol, thisCol - befUpCol);
        float befDownDif = dot(thisCol - befDownCol, thisCol - befDownCol);
        float nextUpDif = dot(thisCol - nextUpCol, thisCol - nextUpCol);
        float nextDownDif = dot(thisCol - nextDownCol, thisCol - nextDownCol);

        float delta = 0.005;
        float delta2 = 0.5;

        float u = 1.0 - thisCol2.r;

        fragColor = thisCol2;

        /* проверяем на разницу в нормалях */
        if(befDif > delta)
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        else {
            if(nextDif > delta)
                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            else {
                if(upDif > delta)
                    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                else {
                    if(downDif > delta)
                        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    else {
                        if(befUpDif > delta)
                            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        else {
                            if(befDownDif > delta)
                                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                            else {
                                if(nextUpDif > delta)
                                    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                                else {
                                    if(nextDownDif > delta)
                                        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                                    else 
                                    {
                                        if(thisCol2[3] != 0.0)
                                        {
                                            float left = floor(befCol2.r * count);
                                            float right = floor(nextCol2.r * count);
                                            float diffGor = abs(left - right);

                                            float down = floor(downCol2.r * count);
                                            float up = floor(upCol2.r * count);
                                            float diffVert = abs(up - down);

                                            float befUp = floor(befUpCol2.r * count);
                                            float nextDown = floor(nextDownCol2.r * count);
                                            float diffUbiv = abs(befUp - nextDown);

                                            float befDown = floor(befDownCol2.r * count);
                                            float nextUp = floor(nextUpCol2.r * count);
                                            float diffVozr = abs(befDown - nextUp);

                                            if(diffGor < delta2 && diffVert < delta2 && diffUbiv < delta2 && diffVozr < delta2)
                                                fragColor = texture(grad_Sampler, vec2(u, 0.0));
                                            else
                                                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                                        }
                                        else
                                        {
                                            if (useWhiteMode)
                                                fragColor = vec4(1.0, 1.0, 1.0, 1.0);
                                            else
                                                fragColor = texture(grad_Sampler, vec2(u, 0.0));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }`;
