precision mediump float;

attribute vec2 vertex_positions;
attribute vec2 vertex_tex_coords;

varying vec2 v2f_uv;

void main() {
    v2f_uv = vertex_tex_coords;
    gl_Position = vec4(vertex_positions, 0.0, 1.0);
} 