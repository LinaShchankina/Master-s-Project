export const vsSource = `#version 300 es
    precision highp float;
    
    in vec3 a_VertexPosition;
    in vec3 a_Normals;
    in vec2 a_LocalNumbers;
    in float a_triangleIndex;

    out vec3 v_Normals;
    out vec2 v_LocalNumbers;
    out vec3 v_Position;
    out float v_triangleIndex;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    
    void main(void) 
    {        
        gl_Position = uPMatrix * uMVMatrix * vec4(a_VertexPosition, 1.0);
        v_Position = (uPMatrix * vec4(a_VertexPosition, 1.0)).xyz;
        v_LocalNumbers = a_LocalNumbers;
        v_Normals = a_Normals;
        v_triangleIndex = a_triangleIndex;
    }`;
