#define PROCESSING_TEXTURE_SHADER

attribute vec4 vertex_positions;
attribute vec2 vertex_tex_coords;

uniform mat4 view_proj_matrix;
uniform mat4 model_matrix;

varying vec4 vertColor;
varying vec4 vertTexCoord;

void main() {
  gl_Position = view_proj_matrix * model_matrix * vertex_positions;
    
  vertColor = vec4(1.0, 1.0, 1.0, 1.0);
  vertTexCoord = vec4(vertex_tex_coords, 1.0, 1.0);
}
