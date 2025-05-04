precision mediump float;

// Varying values passed from the vertex shader
varying vec2 v2f_uv;
varying vec3 v2f_world_pos;
varying vec3 v2f_world_normal;
varying vec3 v2f_light_dir;

varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;

// Global variables specified in "uniforms" entry of the pipeline
uniform sampler2D material_texture;
uniform bool is_textured;
uniform vec3 material_base_color;
uniform float material_shininess;
uniform vec3 light_color;
uniform vec3 light_position;
uniform float ambient_factor;

// Toon shading parameters
uniform int toon_levels;
uniform float toon_scale;
uniform float outline_threshold;

void main()
{
    // Normalize vectors
    vec3 normal = normalize(v2f_world_normal);
    vec3 light_dir = normalize(v2f_light_dir);
    vec3 view_dir = normalize(light_position - v2f_world_pos);
    
    // Get base color from texture or material
    vec3 material_color = material_base_color;
    if (is_textured) {
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz;
    }

    // Calculate diffuse lighting
    float diffuse = max(0.0, dot(normal, light_dir));
    
    // Quantize the diffuse value
    float level = floor(diffuse * float(toon_levels)) / float(toon_levels);
    diffuse = level * toon_scale;

    // Calculate specular lighting
    vec3 half_dir = normalize(light_dir + view_dir);
    float specular = pow(max(0.0, dot(normal, half_dir)), material_shininess);
    
    // Quantize the specular value
    level = floor(specular * float(toon_levels)) / float(toon_levels);
    specular = level * toon_scale;

    // Calculate ambient lighting
    vec3 ambient = ambient_factor * material_color;

    // Combine lighting components
    vec3 color = ambient + light_color * material_color * (diffuse + specular);

    // Optional: Add outline effect
    //float edge = dot(normalize(v2f_normal), normalize(-v2f_frag_pos)) + 1.;
    //if (edge < outline_threshold) {
    //    color = vec3(0.0, 0.0, 0.0); // Black outline
    //}

    gl_FragColor = vec4(color, 1.0);
} 
