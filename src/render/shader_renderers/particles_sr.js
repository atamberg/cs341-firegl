import { texture_data } from "../../cg_libraries/cg_render_utils.js"
import { ShaderRenderer } from "./shader_renderer.js";
import { vec2, vec3, vec4, mat3, mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js"
import { add } from "../../../lib/gl-matrix_3.3.0/esm/vec3.js";

export class ParticlesShaderRender extends ShaderRenderer {
    constructor(regl, resource_manager) {
        super(regl, resource_manager, 'billboard.vert.glsl', 'billboard.frag.glsl');
    }

    render(scene_state) {
        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const { texture, is_textured } = texture_data(obj, this.resource_manager);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: this.resource_manager.get_mesh(obj.mesh_reference),
                particle_offsets: {
                    buffer: obj.particle_list.map(p => p.offset),
                    divisor: 1,
                },
                particle_colors: {
                    buffer: obj.particle_list.map(p => p.color),
                    divisor: 1,
                },
                particle_scale: {
                    buffer: obj.particle_list.map(p => p.scale_multiplier),
                    divisor: 1,
                },


                particleCenter_worldspace: obj.translation,
                mat_view: scene.camera.mat.view,
                particle_count: obj.particle_count,

                material_texture: texture,
                is_textured: is_textured,

                mat_mvp: mat_model_view_projection
            })
        }

        this.pipeline(inputs)
    }

    attributes(regl) {
        const attr = super.attributes(regl);
        attr.vertex_offset = regl.prop('particle_offsets');
        attr.vertex_color = regl.prop('particle_colors');
        attr.vertex_scale = regl.prop('particle_scale');
        return attr;
    }

    uniforms(regl) {
        return {
            particleCenter_worldspace: regl.prop('particleCenter_worldspace'),
            mat_view: regl.prop('mat_view'),

            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),

            mat_mvp: regl.prop('mat_mvp')
        };
    }

    exclude_object(obj) {
        // Do not shade objects that use other dedicated shader
        return !obj.material.properties.includes('particles');
    }

    init_pipeline() {
        const regl = this.regl;

        return regl({

            attributes: this.attributes(regl),

            // Faces, as triplets of vertex indices
            elements: regl.prop('mesh.faces'),

            depth: this.depth(),

            cull: this.cull(),

            blend: this.blend(),

            // Uniforms: global data available to the shader
            uniforms: this.uniforms(regl),

            // Shaders
            vert: this.vert_shader,
            frag: this.frag_shader,

            instances: regl.prop('particle_count')
        });
    }
}
