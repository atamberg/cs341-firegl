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
    
    // Add bloom to the original color using screen blending for better color preservation
    // Screen blend: 1.0 - (1.0 - a) * (1.0 - b)
    vec3 bloomColor = bloom.rgb * u_bloom_intensity;
    vec3 blendedColor = vec3(1.0) - (vec3(1.0) - original.rgb) * (vec3(1.0) - bloomColor);
    
    // Apply a simplified tone mapping that preserves colors better
    vec3 result = blendedColor * u_exposure;
    
    // Ensure we don't exceed valid color range
    result = clamp(result, vec3(0.0), vec3(1.0));
    
    // Output the final color with original alpha
    gl_FragColor = vec4(result, original.a);
}