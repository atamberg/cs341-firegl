precision mediump float;

// Varying values passed from the vertex shader
varying vec3 v2f_light_dir;        // Direction to light in world space
varying vec4 vPosition;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3 light_color;          // Color of the light
uniform vec3 light_position;       // Position of the light in world space
uniform float light_radius;        // Radius of the light

// Toon shading parameters
uniform int toon_levels;           // Number of discrete color bands
uniform float outline_threshold;   // Threshold for outline detection
uniform vec3 outline_color;        // Color of the outline

uniform sampler2D positionBuffer, normalBuffer, albedoSpecBuffer;

void main()
{
    // vertex position on canvas
    vec2 uv = (vPosition.xy / vPosition.w ) * 0.5 + 0.5;
    vec3 v2f_frag_pos = texture2D(positionBuffer, uv).xyz;
    vec3 v2f_normal = texture2D(normalBuffer, uv).xyz;
    vec3 material_color = texture2D(albedoSpecBuffer, uv).rgb;
    float material_shininess = texture2D(albedoSpecBuffer, uv).a;

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

    // Check for outline
    //float outline = 0.0;
    //vec3 view_normal = normalize(v2f_normal);
    //vec3 view_frag_pos = normalize(v2f_frag_pos);
    //float edge = 1.0 - dot(view_normal, view_frag_pos);
    // Combine all lighting components to get final color
    vec3 color = attenuation * light_color * material_color * (diffuse + specular);
    
    gl_FragColor = vec4(color, 1.0);
}
