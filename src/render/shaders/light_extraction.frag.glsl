#version 100

precision mediump float;

uniform sampler2D u_input;
uniform float u_threshold;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    // Sample the scene texture
    vec4 color = texture2D(u_input, v_texCoord);
    
    // Calculate luminance using standard RGB to luminance conversion
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Check whether fragment output is higher than threshold
    if (brightness > u_threshold) {
        // Output bright areas scaled by intensity
        gl_FragColor = vec4(color.rgb * u_intensity, 1.0);
    } else {
        // Below threshold, output black (no contribution to bloom)
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
