// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords; // optional
attribute vec3 vertex_offset;
attribute vec3 vertex_color;
attribute vec2 vertex_scale;

// Varying values passed to fragment shader
varying vec2 v2f_uv;
varying vec3 vColor;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3 particleCenter_worldspace;
uniform mat4 mat_view;
uniform mat4 mat_mvp;

void main() {
	vec3 cameraRight_worldspace = vec3(mat_view[0][0], mat_view[1][0], mat_view[2][0]);
	vec3 cameraUp_worldspace = vec3(mat_view[0][1], mat_view[1][1], mat_view[2][1]);

	vec3 center_offset = vertex_offset;

	vec3 vertexPosition_worldspace =
		center_offset
		+ cameraRight_worldspace * vertex_positions.x * vertex_scale.x
		- cameraUp_worldspace * vertex_positions.y * vertex_scale.y;

	gl_Position = mat_mvp * vec4(vertexPosition_worldspace, 1);

	vColor = vertex_color;
	v2f_uv = vertex_tex_coords;
}
