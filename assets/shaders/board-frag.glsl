#version 300 es

precision mediump float;

in vec2 v_texCoord;

out vec4 outColor;

uniform sampler2D sampler;

void main() {
    outColor = texture(sampler, v_texCoord);
}
