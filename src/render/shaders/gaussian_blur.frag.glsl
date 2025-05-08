#version 100

precision mediump float;

uniform sampler2D u_input;
uniform float u_blur_radius;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

const float PI = 3.141592653589793;

float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * PI) * sigma);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 texelSize = 1.0 / u_resolution;
    
    float sigma = u_blur_radius;
    float totalWeight = 0.0;
    vec3 color = vec3(0.0);
    
    // Apply Gaussian blur in both directions
    for (float x = -3.0; x <= 3.0; x++) {
        for (float y = -3.0; y <= 3.0; y++) {
            vec2 offset = vec2(x, y) * texelSize;
            float weight = gaussian(length(offset), sigma);
            color += texture2D(u_input, uv + offset).rgb * weight;
            totalWeight += weight;
        }
    }
    
    // Clamp the color to prevent overflow
    color = clamp(color / totalWeight, vec3(0.0), vec3(1.0));
    
    gl_FragColor = vec4(color, 1.0);
}
