precision mediump float;

attribute vec3 vertex_normal;
attribute vec3 vertex_positions;
attribute vec2 vertex_tex_coords;

uniform mat4 mat_model_view;
uniform mat4 mat_model_view_projection;
uniform mat3 mat_normals_model_view;

varying vec2 vTexture;
varying vec4 vNormal;
varying vec4 vPosition;

void main() {
    vNormal = normalize(vec4(mat_normals_model_view * vertex_normal, 0.));
    vPosition = mat_model_view * vec4(vertex_positions, 1.);
    vTexture = vertex_tex_coords;
    gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
}
