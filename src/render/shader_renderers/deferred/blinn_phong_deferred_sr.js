import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { vec4FromVec3 } from "../../../cg_libraries/cg_math.js";
import { cg_mesh_make_uv_sphere } from "../../../cg_libraries/cg_mesh.js";
import { light_to_cam_view } from "../../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./../shader_renderer.js"


export class BlinnPhongDeferredShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render a scene with the blinn-phong model
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        resource_manager.resources["blinn_phong_deferred.frag.glsl"] = blinn_phong_deferred_fragment_shader();
        super(
            regl,
            resource_manager,
            `deferred.vert.glsl`,
            `blinn_phong_deferred.frag.glsl`
        );

        this.light_sphere = cg_mesh_make_uv_sphere(16);
    }

    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {
        const scene = scene_state.scene;
        // no ambient lighting is done here

        const mat_model_view_projection = mat4.create();

        scene.lights.forEach(light => {
            const inputs = [];
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view)
            const radius = light.radius;

            mat4.fromTranslation(mat_model_view_projection, vec4FromVec3(light_position_cam, 1.));
            mat4.scale(mat_model_view_projection, mat_model_view_projection, [radius, radius, radius]);
            mat4.multiply(mat_model_view_projection, scene.camera.mat.projection, mat_model_view_projection);

            inputs.push({
                mesh: this.light_sphere,
                albedoSpec: gBuffer.color[0],
                normal: gBuffer.color[1],
                position: gBuffer.color[2],

                mat_model_view_projection: mat_model_view_projection,

                light_color: light.color,
                light_position: light_position_cam,
                light_radius: radius,
            });

            this.pipeline(inputs);
        });
    }

    depth() {
        return {
            enable: false,
        };
    }

    blend() {
        // Additive blend mode
        return {
            enable: true,
            func: {
                src: 'one',
                dst: 'one',
            },
        };
    }

    cull() {
        // draw back face
        return { enable: true, face: 'back' }; 
    }

    uniforms(regl) {
        return {
            // gBuffer Data
            albedoSpecBuffer: regl.prop('albedoSpec'),
            normalBuffer: regl.prop('normal'),
            positionBuffer: regl.prop('position'),

            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),

            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),
            light_radius: regl.prop('light_radius'),
        };
    }
}

function blinn_phong_deferred_fragment_shader() {
    return `
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

            float material_ambient = 0.6;

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
        `;
}
