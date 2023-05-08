#version 300 es

precision mediump float;

in vec3 vertPosition;
in vec2 texCoord;

out vec2 v_texCoord;

uniform mat4 projMatrix;

void main() {
    gl_Position = projMatrix * vec4(vertPosition, 1.0);
    v_texCoord = texCoord;
}