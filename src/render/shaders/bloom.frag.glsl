precision mediump float;
precision mediump int;

uniform sampler2D u_texture;

varying vec4 vertColor;
varying vec4 vertTexCoord;

uniform float brightPassThreshold;

void main() {
    vec3 luminanceVector = vec3(0.2125, 0.7154, 0.0721);
    vec4 c = texture2D(u_texture, vertTexCoord.st) * vertColor;

    float luminance = dot(luminanceVector, c.xyz);
    luminance = max(0.0, luminance - brightPassThreshold);
    c.xyz *= sign(luminance);
    c.a = 1.0;

    gl_FragColor = c;
}
