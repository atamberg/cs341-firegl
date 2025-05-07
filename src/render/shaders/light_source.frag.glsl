precision mediump float;

// Varying values passed from the vertex shader
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec2 v2f_uv;

// Uniforms passed from the pipeline
uniform vec3 light_position;
uniform vec3 light_color;
uniform float ambient_factor;
uniform vec3 material_emissive;

void main() {
    // Calculate light direction and normalize
    vec3 l = normalize(light_position - v2f_frag_pos);
    
    // Calculate normal and normalize
    vec3 n = normalize(v2f_normal);
    
    // Calculate diffuse lighting
    float diffuse = max(0.0, dot(n, l));
    
    // Combine ambient, diffuse, and emissive lighting
    vec3 result = (ambient_factor + diffuse) * light_color + material_emissive;
    
    // Output the final color with alpha
    gl_FragColor = vec4(result, 1.0);
}
