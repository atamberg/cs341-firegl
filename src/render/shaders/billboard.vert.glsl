// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords; // optional

// Varying values passed to fragment shader
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3 particleCenter_worldspace;
uniform mat4 mat_view;
uniform mat4 mat_mvp;
uniform vec2 billboardSize;

void main() {
	vec3 cameraRight_worldspace = vec3(mat_view[0][0], mat_view[1][0], mat_view[2][0]);
	vec3 cameraUp_worldspace = vec3(mat_view[0][1], mat_view[1][1], mat_view[2][1]);

	vec3 vertexPosition_worldspace =
		particleCenter_worldspace
		+ cameraRight_worldspace * vertex_positions.x * billboardSize.x
		- cameraUp_worldspace * vertex_positions.y * billboardSize.y;

	vec4 finalPos = mat_mvp * vec4(vertexPosition_worldspace, 1);

	v2f_uv = vertex_tex_coords;
	gl_Position = finalPos;
}
