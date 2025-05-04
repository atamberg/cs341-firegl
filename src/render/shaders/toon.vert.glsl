precision mediump float;

// Vertex attributes
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords;

// Varying values passed to the fragment shader
varying vec2 v2f_uv;
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec3 v2f_light_dir;

// Global uniform variables
uniform mat4 mat_model_view;
uniform mat4 mat_model_view_projection;
uniform mat3 mat_normals_model_view;
uniform vec3 light_position;

void main()
{
    // Pass texture coordinates to fragment shader
    v2f_uv = vertex_tex_coords;

    // Calculate fragment position in camera space
    v2f_frag_pos = (mat_model_view * vec4(vertex_positions, 1.0)).xyz;

    // Calculate normal in camera space
    v2f_normal = mat_normals_model_view * vertex_normal;

    // Calculate light direction in camera space
    v2f_light_dir = light_position - v2f_frag_pos;

    // Calculate final vertex position on the canvas
    gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
} 