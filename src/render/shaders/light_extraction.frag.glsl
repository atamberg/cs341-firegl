#version 100

precision mediump float;

uniform sampler2D u_input;
uniform float u_threshold;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    vec3 color = texture2D(u_input, v_texCoord).rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    // Only keep pixels above the threshold
    vec3 extracted = color * step(u_threshold, luminance);
    
    // Apply intensity
    gl_FragColor = vec4(extracted * u_intensity, 1.0);
}
