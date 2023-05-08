#version 300 es

precision mediump float;

in vec3 v_normal;
in vec3 v_lightRay;
in vec3 v_eyeVec;

out vec4 outColor;

uniform vec3 ambientLightColor;
uniform vec3 diffuseLightColor;
uniform vec3 specularLightColor;


void main() {
    vec3 L = normalize(v_lightRay);
    vec3 N = normalize(v_normal);

    float lambertTerm = dot(N, -L);

    vec4 Ia = vec4(ambientLightColor, 1.0);
    vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);

    if (lambertTerm > 0.0) {
        Id = vec4(diffuseLightColor, 1.0) * lambertTerm;
        vec3 E = normalize(v_eyeVec);
        vec3 R = reflect(L, N);
        float specular = pow(max(dot(R, E), 0.0), 50.0);
        Is = vec4(specularLightColor, 1.0) * specular;
    }

    outColor = Ia + Id + Is;
}