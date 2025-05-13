#version 100

precision mediump float;

uniform sampler2D u_input;
uniform float u_blur_radius;
uniform vec2 u_resolution;
uniform bool u_horizontal;

varying vec2 v_texCoord;

// Pre-calculated Gaussian weights for 5 samples
// GLSL ES 1.00 doesn't support array constructors, so we need to use individual variables
const float weight0 = 0.227027;
const float weight1 = 0.1945946;
const float weight2 = 0.1216216;
const float weight3 = 0.054054;
const float weight4 = 0.016216;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec3 result = texture2D(u_input, v_texCoord).rgb * weight0; // current fragment's contribution
    // We do a 5-tap filter with the predefined gaussian weights
    // Apply blur in one direction only (horizontal or vertical)
    if (u_horizontal) {
        // Horizontal blur - unroll the loop for GLSL 1.00 compatibility
        // Sample 1
        result += texture2D(u_input, v_texCoord + vec2(texelSize.x, 0.0)).rgb * weight1;
        result += texture2D(u_input, v_texCoord - vec2(texelSize.x, 0.0)).rgb * weight1;
        
        // Sample 2
        result += texture2D(u_input, v_texCoord + vec2(texelSize.x * 2.0, 0.0)).rgb * weight2;
        result += texture2D(u_input, v_texCoord - vec2(texelSize.x * 2.0, 0.0)).rgb * weight2;
        
        // Sample 3
        result += texture2D(u_input, v_texCoord + vec2(texelSize.x * 3.0, 0.0)).rgb * weight3;
        result += texture2D(u_input, v_texCoord - vec2(texelSize.x * 3.0, 0.0)).rgb * weight3;
        
        // Sample 4
        result += texture2D(u_input, v_texCoord + vec2(texelSize.x * 4.0, 0.0)).rgb * weight4;
        result += texture2D(u_input, v_texCoord - vec2(texelSize.x * 4.0, 0.0)).rgb * weight4;
    } else {
        // Vertical blur - unroll the loop for GLSL ES 1.00 compatibility
        // Sample 1
        result += texture2D(u_input, v_texCoord + vec2(0.0, texelSize.y)).rgb * weight1;
        result += texture2D(u_input, v_texCoord - vec2(0.0, texelSize.y)).rgb * weight1;
        
        // Sample 2
        result += texture2D(u_input, v_texCoord + vec2(0.0, texelSize.y * 2.0)).rgb * weight2;
        result += texture2D(u_input, v_texCoord - vec2(0.0, texelSize.y * 2.0)).rgb * weight2;
        
        // Sample 3
        result += texture2D(u_input, v_texCoord + vec2(0.0, texelSize.y * 3.0)).rgb * weight3;
        result += texture2D(u_input, v_texCoord - vec2(0.0, texelSize.y * 3.0)).rgb * weight3;
        
        // Sample 4
        result += texture2D(u_input, v_texCoord + vec2(0.0, texelSize.y * 4.0)).rgb * weight4;
        result += texture2D(u_input, v_texCoord - vec2(0.0, texelSize.y * 4.0)).rgb * weight4;
    }
    
    // Output the blurred color
    gl_FragColor = vec4(result, 1.0);
}
