#version 100

precision mediump float;

uniform sampler2D u_original;
uniform sampler2D u_bloom;
uniform float u_bloom_intensity;

varying vec2 v_texCoord;

void main() {
    // Get colors
    vec4 original = texture2D(u_original, v_texCoord);
    vec4 bloom = texture2D(u_bloom, v_texCoord);
    
    // Scale bloom intensity
    vec3 bloom_rgb = bloom.rgb * u_bloom_intensity;
    
    // Combine using screen blend mode
    vec3 combined = original.rgb + (1.0 - original.rgb) * bloom_rgb;
    
    // Clamp to prevent overflow
    combined = clamp(combined, vec3(0.0), vec3(1.0));
    
    gl_FragColor = vec4(combined, original.a);
}