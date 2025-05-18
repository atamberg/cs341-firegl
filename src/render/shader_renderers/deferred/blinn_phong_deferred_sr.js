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
    }

    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {

        const scene = scene_state.scene;
        const inputs = [];

        let ambient_factor = scene.ambient_factor;

        // For every light in the scene we render the blinn-phong contributions
        // Results will be added on top of each other (see this.blend())
        scene.lights.forEach(light => {

            // Transform light position into camera space
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);

            for (const obj of scene.objects) {

                // Check if object is Blinn-Phong shaded
                if (this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);

                const {
                    mat_model_view,
                    mat_model_view_projection,
                    mat_normals_model_view
                } = scene.camera.object_matrices.get(obj);

                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    albedoSpec: gBuffer.color[0],
                    normal: gBuffer.color[1],
                    position: gBuffer.color[2],

                    mat_model_view_projection: mat_model_view_projection,

                    light_position: light_position_cam,
                    light_color: light.color,

                    ambient_factor: ambient_factor,
                });

            }

            this.pipeline(inputs);
            // Set to 0 the ambient factor so it is only taken into account once during the first light render
            ambient_factor = 0;
        });
    }

    exclude_object(obj) {
        // Do not shade objects that use other dedicated shader
        return obj.material.properties.includes('no_blinn_phong');
    }

    depth() {
        // Use z buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    blend() {
        // Additive blend mode
        return {
            enable: true,
            func: {
                src: 1,
                dst: 1,
            },
        };
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

            // Ambient factor
            ambient_factor: regl.prop('ambient_factor'),
        };
    }
}

function blinn_phong_deferred_vertex_shader() {
    return `
        precision mediump float;

        attribute vec3 vertex_positions;

        uniform mat4 mat_model_view_projection;

        varying vec4 vPosition;

        void main() {
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
            vPosition = gl_Position;
        }
        `;
}

function blinn_phong_deferred_fragment_shader() {
    return `
        precision mediump float;

        varying vec4 vPosition;

        uniform sampler2D positionBuffer, normalBuffer, albedoSpecBuffer;

        uniform vec3 light_color;
        uniform vec3 light_position;
        uniform float ambient_factor;

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

            // Compute ambient
            vec3 ambient = ambient_factor * material_color * material_ambient;

            float light_distance = length(light_position - v2f_frag_pos);
            float attenuation = 1.0 / pow(light_distance, 0.25);

            // Compute pixel color
            vec3 color = ambient + (attenuation * light_color * material_color * (diffuse + specular));

            gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
        }
        `;
}
