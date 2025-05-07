#version 100

precision mediump float;

uniform sampler2D u_original;
uniform sampler2D u_bloom;
uniform float u_bloom_intensity;

varying vec2 v_texCoord;

void main() {
    vec3 original = texture2D(u_original, v_texCoord).rgb;
    vec3 bloom = texture2D(u_bloom, v_texCoord).rgb;
    
    // Combine original with bloom
    gl_FragColor = vec4(original + bloom * u_bloom_intensity, 1.0);
}
