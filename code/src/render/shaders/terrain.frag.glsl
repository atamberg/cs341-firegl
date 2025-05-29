precision highp float;

varying float v2f_height;

// Varying values passed to fragment shader
varying vec3 v2f_normal;
varying vec3 v2f_frag_pos;
varying vec3 v2f_light_position;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3  light_color;
uniform vec3  water_color;
uniform vec3  grass_color;
uniform vec3  peak_color;
uniform float  water_shininess;
uniform float  grass_shininess;
uniform float  peak_shininess;

uniform float ambient_factor;

// Small perturbation to prevent "z-fighting" on the water on some machines...
const float terrain_water_level    = -0.03125 + 1e-6;

void main()
{
	float material_ambient = 0.1; // Ambient light coefficient
	float height = v2f_height;
	vec3 light_position = v2f_light_position;

	vec3 material_color = grass_color;
	float shininess = grass_shininess;

	if (height <= terrain_water_level){
		material_color = water_color;
		shininess = water_shininess;
	}
	else{
		float a = (height - terrain_water_level)*2.;
		material_color = mix(grass_color, peak_color, a);
		shininess = mix(grass_shininess, peak_shininess, a);
	}

	// Blinn-Phong lighting model
	vec3 v = normalize(-v2f_frag_pos);
	vec3 l = normalize(light_position - v2f_frag_pos);
	vec3 n = normalize(v2f_normal);
	float dist_frag_light = length(v2f_frag_pos - light_position);

	vec3 h = normalize(l + v);

    // Compute diffuse
    vec3 diffuse = vec3(0.0);
	diffuse = material_color * max(dot(n, l), 0.0);
	
	// Compute specular
    vec3 specular = vec3(0.0);
	float s = dot(h, n);
	if (s > 0.0){
		specular = material_color * pow(s, shininess);
	}

	// Compute ambient
	vec3 ambient = ambient_factor * material_color * material_ambient;

	//float attenuation = 1. / (dist_frag_light * dist_frag_light);
	
	// Compute pixel color
    vec3 color = ambient + (light_color * (diffuse + specular));
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}