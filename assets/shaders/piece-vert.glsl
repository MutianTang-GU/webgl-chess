#version 300 es

precision mediump float;

in vec3 vertPosition;
in vec3 vertNormal;

out vec3 v_normal;
out vec3 v_lightRay;
out vec3 v_eyeVec;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

uniform vec3 lightPosition;

void main() {
    vec4 vertexLocation = viewMatrix * vec4(vertPosition, 1.0);
    gl_Position = projMatrix * vertexLocation;

    mat4 normalMatrix = transpose(inverse(viewMatrix));

    v_normal = vec3(normalMatrix * vec4(vertNormal, 1.0));
    v_lightRay = vertexLocation.xyz - lightPosition;
    v_eyeVec = -vertexLocation.xyz;
}