precision mediump float;

// Varying values passed from the vertex shader
varying vec2 v2f_uv;               // Texture coordinates for this fragment
varying vec3 v2f_world_pos;        // Fragment position in world space
varying vec3 v2f_world_normal;     // Normal vector in world space
varying vec3 v2f_light_dir;        // Direction to light in world space
varying vec3 v2f_frag_pos;         // Fragment position in view space
varying vec3 v2f_normal;           // Normal in view space

// Global variables specified in "uniforms" entry of the pipeline
uniform sampler2D material_texture;  // Texture for the material (if any)
uniform bool is_textured;           // Whether to use texture or base color
uniform vec3 material_base_color;   // Base color of the material
uniform float material_shininess;   // How shiny the material is

uniform vec3 light_color;          // Color of the light
uniform vec3 light_position;       // Position of the light in world space
uniform float light_radius;     

// Toon shading parameters
uniform int toon_levels;           // Number of discrete color bands
uniform float outline_threshold;   // Threshold for outline detection
uniform vec3 outline_color;        // Color of the outline

void main()
{
    // Get base color from texture or material
    vec3 material_color = material_base_color;
    if (is_textured) {
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz;
    }

    // Normalize vectors for lighting calculations
    vec3 normal = normalize(v2f_normal);
    vec3 light_dir = normalize(light_position - v2f_frag_pos);
    vec3 view_dir = normalize(-v2f_frag_pos);

    // Calculate specular lighting (shiny highlights)
    vec3 half_dir = normalize(light_dir + view_dir);
    float h_dot_n = clamp(dot(half_dir, normal), 1e-12, 1.);
    
    // Calculate diffuse lighting (how much light hits the surface)
    float diffuse = max(0.0, dot(normal, light_dir));

    float specular = diffuse > 0. ? pow(h_dot_n, material_shininess) : 0.;

    // Quantize the diffuse value to create discrete color bands
    float diffuse_floor = floor(diffuse * float(toon_levels)) / float(toon_levels);
    float diffuse_ceil = diffuse_floor + (1. / float(toon_levels));
    diffuse = diffuse_floor + (diffuse_ceil - diffuse_floor) / 2.;
    
    // Quantize the specular value to match the toon style
    float specular_floor = floor(specular * float(toon_levels)) / float(toon_levels);
    float specular_ceil = specular_floor + (1. / float(toon_levels));
    specular = specular_floor + (specular_ceil - specular_floor) / 2.;

    float light_distance = length(light_position - v2f_frag_pos);
    float attenuation = max(0., 1.0 - light_distance / light_radius);

    // Combine all lighting components to get final color
    // Scale down the contribution of each light to prevent over-brightening
    vec3 color = attenuation * light_color * material_color * (diffuse + specular);
    
    // Use alpha of 1.0 for proper additive blending
    gl_FragColor = vec4(color, 1.0);
} 
