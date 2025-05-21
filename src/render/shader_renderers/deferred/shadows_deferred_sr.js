import { texture_data, light_to_cam_view } from "../../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../../scene_resources/resource_manager.js";
import { EnvironmentCapture } from "../../env_capture.js"
import { ShaderRenderer } from "./../shader_renderer.js";
import { ShadowMapShaderRenderer } from "./../shadow_map_sr.js"


export class ShadowsDeferredShaderRenderer extends ShaderRenderer {

    /**
     * Used to produce a black & white map of the shadows of 
     * the scene using the cube map method for a point light
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        resource_manager.resources["shadows_deferred.frag.glsl"] = shadows_deferred_fragment_shader();
        super(
            regl,
            resource_manager,
            `deferred.vert.glsl`,
            `shadows_deferred.frag.glsl`
        );
        this.env_capture = new EnvironmentCapture(regl, resource_manager);
        // Here we instanciante the ShadowMapShaderRenderer directly into the ShadowsShaderRenderer 
        // because the latter needs to pass shadow_map render function to the env_capture to generate the cube_map 
        this.shadow_map = new ShadowMapShaderRenderer(regl, resource_manager);
    }

    /**
     * The result is a combination of all the light's cast shadows.
     * White means "shadows" black means "no shadows"
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {

        const scene = scene_state.scene;

        // For every light build a shadow map and do a render of the shadows
        this.regl.clear({ color: [0, 0, 0, 1] });

        const num_lights = scene.lights.length;

        scene.lights.forEach(light => {
            const inputs = [];
            // Transform light position into camera space
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);

            // Computation of the cube map from the light
            const cube_shadowmap = this.compute_shadow_cube_map(scene_state, light);

            for (const obj of scene.objects) {

                if (this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);

                const {
                    mat_model_view,
                    mat_model_view_projection,
                    mat_normals_model_view
                } = scene.camera.object_matrices.get(obj);

                inputs.push({
                    mesh: mesh,

                    positionBuffer: gBuffer.color[2],

                    mat_model_view_projection: mat_model_view_projection,

                    light_position_cam: light_position_cam,
                    num_lights: num_lights,

                    cube_shadowmap: cube_shadowmap,
                });
            }

            this.pipeline(inputs);
        });
    }


    exclude_object(obj) {
        // Exclude object with environment material: the sky does not cast shadows
        return ['environment', 'billboard', 'particles'].some(p => obj.material.properties.includes(p));
    }

    compute_shadow_cube_map(scene_state, light) {
        const light_position = light.position;

        this.env_capture.capture_scene_cubemap(
            scene_state,
            light_position, // position from which to render the cube map
            (s_s) => { this.shadow_map.render(s_s) } // function used to render the cube map
        );
        return this.env_capture.env_cubemap;
    }


    depth() {
        // Use the z-buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    blend() {
        return {
            enable: true,
            func: {
                src: 'src alpha',
                dst: 'one minus src alpha'
            },
            equation: 'add' 
        };
    }

    uniforms(regl) {
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),

            positionBuffer: regl.prop('positionBuffer'),
            // Light
            light_position_cam: regl.prop('light_position_cam'),
            num_lights: regl.prop('num_lights'),

            // Cube map
            cube_shadowmap: regl.prop('cube_shadowmap'),
        };
    }

}

function shadows_deferred_fragment_shader() {
    return `
        precision highp float;

        // Varying values passed from the vertex shader
        varying vec4 vPosition;

        uniform sampler2D positionBuffer;

        // Global variables specified in "uniforms" entry of the pipeline
        uniform vec3 light_position_cam; // light position in camera coordinates
        uniform samplerCube cube_shadowmap;
        uniform float num_lights;

        void main() {
                vec2 uv = (vPosition.xy / vPosition.w ) * 0.5 + 0.5;

                vec3 v2f_frag_pos = texture2D(positionBuffer, uv).xyz;
                
                vec3 v = normalize(-v2f_frag_pos);
                vec3 l = normalize(light_position_cam - v2f_frag_pos);
                float dist_frag_light = length(v2f_frag_pos - light_position_cam);


                // Get shadow map
                vec4 result = textureCube(cube_shadowmap, -l);
                float shadow_depth = result.r;

                vec3 color = vec3(0.0);

                // if the distance of the fragment from the light is farther 
                // than the one we saved in the cube map, then this fragment is in shadows
                if ((dist_frag_light > 1.01 *shadow_depth)){
                        color = vec3(1.0/num_lights);
                }

                gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
        }
        `;
}
