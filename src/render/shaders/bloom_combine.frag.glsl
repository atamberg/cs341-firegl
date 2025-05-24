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
    
    // Calculate original luminance
    float originalLuminance = dot(original.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Scale bloom by intensity
    vec3 bloomColor = bloom.rgb * u_bloom_intensity;
    
    // Use a modified additive blend
    // helps prevent color shifting when many light sources are present
    vec3 blendedColor = original.rgb + bloomColor * (1.0 - originalLuminance * 0.5);
    
    // Apply exposure adjustment
    vec3 result = blendedColor * u_exposure;
    
    // Apply a soft saturation control to prevent over-saturation
    float luminance = dot(result, vec3(0.2126, 0.7152, 0.0722));
    vec3 saturationAdjusted = mix(vec3(luminance), result, 0.9); // Slightly reduce saturation
    
    // Ensure we don't exceed valid color range
    result = clamp(saturationAdjusted, vec3(0.0), vec3(1.0));
    
    // Output the final color with original alpha
    gl_FragColor = vec4(result, original.a);
}