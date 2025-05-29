import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { mat4_matmul_many } from "../../../cg_libraries/cg_math.js";
import { vec4FromVec3 } from "../../../cg_libraries/cg_math.js";
import { texture_data, light_to_cam_view } from "../../../cg_libraries/cg_render_utils.js"
import { cg_mesh_make_uv_sphere } from "../../../cg_libraries/cg_mesh.js";
import { ResourceManager } from "../../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./../shader_renderer.js"

export class ToonDeferredShaderRenderer extends ShaderRenderer {

    /**
     * Creates a renderer for toon shading
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `deferred/deferred.vert.glsl`,
            `deferred/toon.frag.glsl`
        );
        this.light_sphere = cg_mesh_make_uv_sphere(16);
    }

    /**
     * Render the objects of the scene_state with toon shading
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {
        const scene = scene_state.scene;

        const mat_model_view_projection = mat4.create();

        const mat_model = mat4.create();

        scene.lights.forEach(light => {
            const inputs = [];
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view)
            const radius = light.radius;

            mat4.fromTranslation(mat_model, vec4FromVec3(light.position, 1));
            mat4.scale(mat_model, mat_model, [radius, radius, radius]);
            mat4_matmul_many(mat_model_view_projection, scene.camera.mat.projection, scene.camera.mat.view, mat_model);

            inputs.push({
                mesh: this.light_sphere,
                albedoSpecBuffer: gBuffer.color[0],
                normalBuffer: gBuffer.color[1],
                positionBuffer: gBuffer.color[2],

                mat_model_view_projection: mat_model_view_projection,

                light_color: light.color,
                light_position: light_position_cam,
                light_radius: radius,

                // Toon shading specific parameters
                toon_levels: scene.ui_params.toon_levels || 7, // Number of discrete color levels
                outline_threshold: scene.ui_params.outline_threshold || 0.2, // Threshold for edge detection
                outline_color: scene.ui_params.outline_color || [0.0, 0.0, 0.0], // Black outline by default
            });

            this.pipeline(inputs);
        });
    }

    depth() {
        // Use z buffer
        return {
            enable: false,
        };
    }

    cull() {
        // draw back face
        return { enable: true, face: 'back' }; 
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
            // gBuffer stuff
            albedoSpecBuffer: regl.prop('albedoSpecBuffer'),
            normalBuffer: regl.prop('normalBuffer'),
            positionBuffer: regl.prop('positionBuffer'),

            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model: regl.prop('mat_model'),

            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),
            light_radius: regl.prop('light_radius'),

            // Toon shading parameters
            toon_levels: regl.prop('toon_levels'),
            outline_threshold: regl.prop('outline_threshold'),
            outline_color: regl.prop('outline_color'),
        };
    }
} 
