#extension GL_EXT_draw_buffers : require
precision mediump float;

varying vec2 vTexture;
varying vec4 vPosition;
varying vec4 vNormal;

uniform sampler2D material_texture;
uniform bool is_textured;
uniform vec3 material_base_color;
uniform float material_shininess;

void main()
{
    vec3 material_color = material_base_color;
    if (is_textured){
        material_color = texture2D(material_texture, vTexture).rgb;
    }
    gl_FragData[0] = vec4(material_color, material_shininess);

    gl_FragData[1] = normalize(vNormal);

    gl_FragData[2] = vPosition;
}
