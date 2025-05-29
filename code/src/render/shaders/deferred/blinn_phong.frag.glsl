precision mediump float;

varying vec4 vPosition;

uniform sampler2D positionBuffer, normalBuffer, albedoSpecBuffer;

uniform vec3 light_color;
uniform vec3 light_position;
uniform float light_radius;

void main()
{
    // vertex position on canvas
    vec2 uv = (vPosition.xy / vPosition.w ) * 0.5 + 0.5;
    vec3 v2f_frag_pos = texture2D(positionBuffer, uv).xyz;
    vec3 v2f_normal = texture2D(normalBuffer, uv).xyz;
    vec3 material_color = texture2D(albedoSpecBuffer, uv).rgb;
    float material_shininess = texture2D(albedoSpecBuffer, uv).a;

    // Blinn-Phong lighting model 
    vec3 v = normalize(-v2f_frag_pos);
    vec3 l = normalize(light_position - v2f_frag_pos);
    vec3 n = normalize(v2f_normal);
    vec3 h = normalize(l + v);

    float h_dot_n = clamp(dot(h, n), 1e-12, 1.);

    // Compute diffuse
    float diffuse = max(0.0, dot(n, l));

    // Compute specular
    float specular = (diffuse > 0.0) ? pow(h_dot_n, material_shininess) : 0.0;

    float light_distance = length(light_position - v2f_frag_pos);
    float attenuation = max(0., 1.0 - light_distance / light_radius);

    // Compute pixel color
    vec3 color = (attenuation * light_color * material_color * (diffuse + specular));

    gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}
