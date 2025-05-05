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
uniform float ambient_factor;      // How much ambient light to apply

// Toon shading parameters
uniform int toon_levels;           // Number of discrete color bands
uniform float toon_scale;          // Scale factor for the toon effect
uniform float outline_threshold;   // Threshold for outline detection
uniform vec3 outline_color;        // Color of the outline
uniform bool show_shadows;         // Whether to show shadows

void main()
{
    // Normalize vectors for lighting calculations
    vec3 normal = normalize(v2f_world_normal);
    vec3 light_dir = normalize(v2f_light_dir);
    vec3 view_dir = normalize(light_position - v2f_world_pos);
    
    // Get base color from texture or material
    vec3 material_color = material_base_color;
    if (is_textured) {
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz;
    }

    // Calculate diffuse lighting (how much light hits the surface)
    float diffuse = max(0.0, dot(normal, light_dir));
    
    // Ensure minimum diffuse lighting and preserve base color
    if (show_shadows) {
        diffuse = max(0.2, diffuse); // Allow darker shadows when enabled
    } else {
        diffuse = max(0.4, diffuse); // Keep it brighter when disabled
    }
    
    // Quantize the diffuse value to create discrete color bands
    float level = floor(diffuse * float(toon_levels)) / float(toon_levels);
    diffuse = level * toon_scale;

    // Calculate specular lighting (shiny highlights)
    vec3 half_dir = normalize(light_dir + view_dir);
    float specular = pow(max(0.0, dot(normal, half_dir)), material_shininess);
    
    // Quantize the specular value to match the toon style
    level = floor(specular * float(toon_levels)) / float(toon_levels);
    specular = level * toon_scale;

    // Calculate ambient lighting (base level of light everywhere)
    vec3 ambient = ambient_factor * material_color;

    // Check for outline
    float outline = 0.0;
    vec3 view_normal = normalize(v2f_normal);
    vec3 view_frag_pos = normalize(v2f_frag_pos);
    float edge = 1.0 - dot(view_normal, view_frag_pos);
    if (edge > outline_threshold) {
        outline = smoothstep(outline_threshold, outline_threshold + 0.1, edge);
    }

    // Combine all lighting components to get final color
    vec3 color = ambient + light_color * material_color * (diffuse + specular);
    
    // Apply outline with smooth transition
    color = mix(color, outline_color, outline * 0.3);

    // Apply color quantization to final result
    color = floor(color * float(toon_levels)) / float(toon_levels);
    
    // Ensure minimum brightness and preserve base color
    if (show_shadows) {
        color = max(color, material_color * 0.2); // Allow darker shadows when enabled
    } else {
        color = max(color, material_color * 0.4); // Keep it brighter when disabled
    }

    gl_FragColor = vec4(color, 1.0);
} 