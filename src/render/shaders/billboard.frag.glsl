precision mediump float;

// Varying values passed from the vertex shader
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3 material_base_color;
uniform bool is_textured;
uniform sampler2D material_texture;

void main()
{
    vec3 material_color = material_base_color;

    // check wether the color to display is a base color or comes from a texture
    if (is_textured){
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz + (1. -frag_color_from_texture.w) * material_base_color;
    }

    gl_FragColor = vec4(material_color, 1.); // output: RGBA in 0..1 range
}
