#version 100

precision mediump float;

uniform sampler2D u_original;
uniform sampler2D u_bloom;
uniform float u_bloom_intensity;
uniform float u_exposure;

varying vec2 v_texCoord;

void main() {
    // Sample the original scene color and the bloom texture
    vec4 original = texture2D(u_original, v_texCoord);
    vec4 bloom = texture2D(u_bloom, v_texCoord);
    
    // Add bloom to the original HDR color (additive blending)
    vec3 hdrColor = original.rgb + bloom.rgb * u_bloom_intensity;
    
    // Tone mapping (exposure)
    const float gamma = 2.2;
    vec3 result = vec3(1.0) - exp(-hdrColor * u_exposure);
    
    // Gamma correction
    result = pow(result, vec3(1.0 / gamma));
    
    // Output the final color with original alpha
    gl_FragColor = vec4(result, original.a);
}