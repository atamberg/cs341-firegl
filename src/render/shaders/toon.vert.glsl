precision mediump float;

// Vertex attributes
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords;

// Varying values passed to the fragment shader
varying vec2 v2f_uv;
varying vec3 v2f_world_pos;
varying vec3 v2f_world_normal;
varying vec3 v2f_light_dir;

varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;

// Global uniform variables
uniform mat4 mat_model_view;
uniform mat3 mat_normals_model_view;
uniform mat4 mat_model_view_projection;
uniform mat4 mat_model;  // Model matrix for world space transformation
uniform vec3 light_position;
uniform float outline_threshold;

void main()
{
    // Pass texture coordinates to fragment shader
    v2f_uv = vertex_tex_coords;

    // Calculate world space position
    v2f_world_pos = (mat_model * vec4(vertex_positions, 1.0)).xyz;

    // Calculate world space normal
    v2f_world_normal = (mat_model * vec4(vertex_normal, 0.0)).xyz;

    // Calculate light direction in world space
    v2f_light_dir = light_position - v2f_world_pos;

    v2f_frag_pos = (mat_model_view * vec4(vertex_positions, 1.0)).xyz;

    // normals in camera view
    v2f_normal = normalize(mat_normals_model_view * vertex_normal);

    vec3 adjusted_vertex_pos = vertex_positions;

    float edge = dot(v2f_normal, normalize(-v2f_frag_pos)) + 1.;
    
    adjusted_vertex_pos += 0.01 * (2. - edge) * vertex_normal;

    // Calculate final vertex position on the canvas
    gl_Position = mat_model_view_projection * vec4(adjusted_vertex_pos, 1.0);
} 
