precision mediump float;

// Varying values passed from the vertex shader
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec2 v2f_uv;

// Uniforms passed from the pipeline
uniform vec3 light_position;
uniform vec3 light_color;
uniform float ambient_factor;
uniform float bloom_intensity;
uniform float blur_radius;
uniform sampler2D scene_texture;
uniform vec2 screen_size;

void main() {
    // Calculate light direction and normalize
    vec3 l = normalize(light_position - v2f_frag_pos);
    
    // Calculate normal and normalize
    vec3 n = normalize(v2f_normal);
    
    // Calculate diffuse lighting
    float diffuse = max(0.0, dot(n, l));
    
    // Combine ambient and diffuse lighting
    vec3 base_color = (ambient_factor + diffuse) * light_color;
    
    // Calculate bloom effect
    vec2 texel_size = 1.0 / screen_size;
    vec3 bloom_color = vec3(0.0);
    
    // Apply Gaussian blur using light color
    const int kernel_size = 5;
    float total_weight = 0.0;
    
    for (int x = -kernel_size; x <= kernel_size; x++) {
        for (int y = -kernel_size; y <= kernel_size; y++) {
            float dx = float(x);
            float dy = float(y);
            float weight = exp(-(dx*dx + dy*dy) / (2.0 * blur_radius * blur_radius));
            total_weight += weight;
        }
    }
    
    // Normalize the bloom color using the light color
    float kernel_count = float(kernel_size * 2 + 1);
    bloom_color = light_color * (total_weight / kernel_count * kernel_count);
    
    bloom_color /= total_weight;
    
    // Combine base color with bloom
    vec3 final_color = base_color + bloom_color * bloom_intensity;
    
    // Output the final color
    gl_FragColor = vec4(final_color, 1.0);
}
