#version 100

precision mediump float;

uniform sampler2D u_input;
uniform float u_threshold;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    // Get input color
    vec4 color = texture2D(u_input, v_texCoord);
    
    // Calculate luminance
    float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Extract bright pixels
    if (luminance > u_threshold) {
        gl_FragColor = vec4(color.rgb * u_intensity, color.a);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
