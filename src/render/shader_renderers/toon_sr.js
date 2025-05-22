import { mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js";
import { texture_data, light_to_cam_view } from "../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js"

export class ToonShaderRenderer extends ShaderRenderer {

    /**
     * Creates a renderer for toon shading
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `toon.vert.glsl`,
            `toon.frag.glsl`
        );
    }

    /**
     * Render the objects of the scene_state with toon shading
     * @param {*} scene_state 
     */
    render(scene_state) {
        const scene = scene_state.scene;

        // For every light in the scene we render the toon shading contributions
        scene.lights.forEach(light => {
            for (const obj of scene.objects) {

                // Check if object should be toon shaded
                if (this.exclude_object(obj)) continue;
                const inputs = [];

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const { texture, is_textured } = texture_data(obj, this.resource_manager);
                const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);
                const radius = light.radius;

                const {
                    mat_model_view,
                    mat_model_view_projection,
                    mat_normals_model_view
                } = scene.camera.object_matrices.get(obj);

                const mat_model = mat4.create();
                mat4.fromTranslation(mat_model, obj.translation);
                mat4.scale(mat_model, mat_model, obj.scale);

                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    mat_model_view_projection: mat_model_view_projection,
                    mat_model_view: mat_model_view,
                    mat_model: mat_model,
                    mat_normals_model_view: mat_normals_model_view,

                    light_position: light_position_cam,
                    light_color: light.color,
                    light_radius: radius,

                    material_texture: texture,
                    is_textured: is_textured,
                    material_base_color: obj.material.color,
                    material_shininess: obj.material.shininess,

                    // Toon shading specific parameters
                    toon_levels: scene.ui_params.toon_levels || 7, // Number of discrete color levels
                    outline_threshold: scene.ui_params.outline_threshold || 0.2, // Threshold for edge detection
                    outline_color: scene.ui_params.outline_color || [0.0, 0.0, 0.0], // Black outline by default
                });
                this.pipeline(inputs);
            }
        });
    }

    exclude_object(obj) {
        // Do not shade objects that use other dedicated shader
        return obj.material.properties.includes('no_toon');
    }
    depth() {
        // Use z buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    cull() {
        // Draw back face to match deferred implementation
        return { enable: true, face: 'back' }; 
    }

    blend() {
        // Use additive blending to accumulate light contributions
        return {
            enable: true,
            func: {
                src: 'one',
                dst: 'one',
            },
        };
    }

    uniforms(regl) {
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_model: regl.prop('mat_model'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),

            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),
            light_radius: regl.prop('light_radius'),


            // Material data
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),
            material_base_color: regl.prop('material_base_color'),
            material_shininess: regl.prop('material_shininess'),
            

            // Toon shading parameters
            toon_levels: regl.prop('toon_levels'),
            outline_threshold: regl.prop('outline_threshold'),
            outline_color: regl.prop('outline_color'),
        };
    }
} 
