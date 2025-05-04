import { texture_data } from "../../cg_libraries/cg_render_utils.js"
import { ShaderRenderer } from "./shader_renderer.js";
import { vec2, vec3, vec4, mat3, mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js"

export class BillboardShaderRender extends ShaderRenderer {
    constructor(regl, resource_manager) {
        super(regl, resource_manager, 'billboard.vert.glsl', 'billboard.frag.glsl');
    }

    render(scene_state) {
        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const particle_center_world_space = obj.translation;

            const mat_view = scene.camera.mat.view;

            const billboardSize = vec2.fromValues(4, 1);

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);

            const { texture, is_textured } = texture_data(obj, this.resource_manager);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: mesh,
                particleCenter_worldspace: particle_center_world_space,
                mat_view: mat_view,
                billboardSize: billboardSize,

                material_base_color: obj.material.color,
                material_texture: texture,
                is_textured: is_textured,

                mat_mvp: mat_model_view_projection
            })
        }

        this.pipeline(inputs)
    }

    uniforms(regl) {
        return {
            particleCenter_worldspace: regl.prop('particleCenter_worldspace'),
            mat_view: regl.prop('mat_view'),
            billboardSize: regl.prop('billboardSize'),

            material_base_color: regl.prop('material_base_color'),
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),

            mat_mvp: regl.prop('mat_mvp')
        };
    }

    exclude_object(obj) {
        // Do not shade objects that use other dedicated shader
        return !obj.material.properties.includes('billboard');
    }
}
