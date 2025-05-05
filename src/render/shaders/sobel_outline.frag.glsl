precision mediump float;

varying vec2 v2f_uv;
uniform sampler2D depth_texture;
uniform vec2 resolution;
uniform float outline_thickness;
uniform vec3 outline_color;
uniform float depth_threshold;

void main() {
    vec2 texel = 1.0 / resolution;
    float depth = texture2D(depth_texture, v2f_uv).r;
    
    // Skip edge detection for background (depth = 1.0)
    if (depth >= 0.999999) {
        gl_FragColor = vec4(0.0);
        return;
    }
    
    // Sample neighboring pixels for depth and normal
    float depth_right = texture2D(depth_texture, v2f_uv + vec2(texel.x, 0.0)).r;
    float depth_left = texture2D(depth_texture, v2f_uv + vec2(-texel.x, 0.0)).r;
    float depth_up = texture2D(depth_texture, v2f_uv + vec2(0.0, texel.y)).r;
    float depth_down = texture2D(depth_texture, v2f_uv + vec2(0.0, -texel.y)).r;
    
    // Calculate depth differences
    float depth_diff_x = abs(depth_right - depth_left);
    float depth_diff_y = abs(depth_up - depth_down);
    
    // Calculate edge strength based on depth changes
    float edge_x = step(depth_threshold, depth_diff_x);
    float edge_y = step(depth_threshold, depth_diff_y);
    
    // Only show edges where there's a significant depth change
    float edge = max(edge_x, edge_y);
    
    // Check if we're at a silhouette edge (where depth changes significantly)
    float silhouette = step(depth_threshold * 2.0, max(depth_diff_x, depth_diff_y));
    
    // Combine edge detection with silhouette check
    edge = edge * silhouette;
    
    // Apply outline thickness
    edge = step(outline_thickness, edge);
    
    // Output black for edges, transparent otherwise
    gl_FragColor = vec4(outline_color, edge);
} 