precision mediump float;

// Attributes passed from the pipeline
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords;

// Uniforms passed from the pipeline
uniform mat4 mat_model_view_projection;
uniform mat4 mat_model_view;
uniform mat3 mat_normals_model_view;
uniform vec3 light_position;
uniform vec3 light_color;

// Varying values passed to the fragment shader
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec2 v2f_uv;

void main() {
    // Transform vertex position
    gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
    
    // Pass varying values to fragment shader
    v2f_frag_pos = (mat_model_view * vec4(vertex_positions, 1.0)).xyz;
    v2f_normal = mat_normals_model_view * vertex_normal;
    v2f_uv = vertex_tex_coords;
}
