import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { texture_data } from "../../../cg_libraries/cg_render_utils.js";
import { ShaderRenderer } from "./../shader_renderer.js";

export class GBufferShaderRenderer extends ShaderRenderer {

    /**
     * Used to render position, normal, and texture information into a framebuffer
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `deferred/gbuffer.vert.glsl`,
            `deferred/gbuffer.frag.glsl`
        );
    }

    /**
     * Render the objects of the scene_state into the gBuffer
     * @param {*} scene_state 
     */
    render(scene_state) {

        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
            const { texture, is_textured } = texture_data(obj, this.resource_manager);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: mesh,

                mat_model_view: mat_model_view,
                mat_model_view_projection: mat_model_view_projection,
                mat_normals_model_view: mat_normals_model_view,

                material_texture: texture,
                is_textured: is_textured,
                material_base_color: obj.material.color,
                material_shininess: obj.material.shininess
            });
        }

        this.pipeline(inputs);
    }

    exclude_object(obj) {
        // Exclude object with environment material: the sky does not cast shadows
        return ['particles'].some(p => obj.material.properties.includes(p));
    }

    uniforms(regl) {
        return {
            mat_model_view: regl.prop('mat_model_view'),
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),

            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),
            material_base_color: regl.prop('material_base_color'),
            material_shininess: regl.prop('material_shininess'),
        };
    }
}
