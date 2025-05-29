precision mediump float;

varying vec4 vPosition;

uniform sampler2D buffer;

void main() {
    vec2 uv = (vPosition.xy / vPosition.w ) * 0.5 + 0.5;
    vec3 v2f = texture2D(buffer, uv).xyz;
    gl_FragColor = vec4(v2f, 1);
}
