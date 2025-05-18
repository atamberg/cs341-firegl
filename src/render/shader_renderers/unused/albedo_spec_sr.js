import { mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js";
import { texture_data } from "../../cg_libraries/cg_render_utils.js";
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";


export class AlbedoSpecShaderRenderer extends ShaderRenderer {

    constructor(regl, resource_manager) {
        resource_manager.resources["albedo_spec.vert.glsl"] = albedo_spec_vertex_shader();
        resource_manager.resources["albedo_spec.frag.glsl"] = albedo_spec_fragment_shader();

        super(
            regl,
            resource_manager,
            `albedo_spec.vert.glsl`,
            `albedo_spec.frag.glsl`
        );
    }

    render(scene_state) {

        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
            const {texture, is_textured} = texture_data(obj, this.resource_manager);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: mesh,

                mat_model_view_projection: mat_model_view_projection,
                material_texture: texture,
                is_textured: is_textured,
                material_base_color: obj.material.color,
                material_shininess: obj.material.shininess
            });
        }

        this.pipeline(inputs);
    }

    uniforms(regl) {
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),
            material_base_color: regl.prop('material_base_color'),
            material_shininess: regl.prop('material_shininess'),
        };
    }

    //depth() {
    //    // Use the z-buffer
    //    return {
    //        enable: true,
    //        mask: true,
    //        func: '<=',
    //    };
    //}
}

// Hard coded shaders, equivalent to defining them in a separate glsl file

function albedo_spec_vertex_shader() {
    return `
          precision mediump float;
      
          attribute vec3 vertex_positions;
          attribute vec2 vertex_tex_coords;

          varying vec2 v2f_uv;

          uniform mat4 mat_model_view_projection;

          void main() {
            v2f_uv = vertex_tex_coords;
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
          }
        `;
}

function albedo_spec_fragment_shader() {
    return `
          precision mediump float;

          varying vec2 v2f_uv;

          uniform sampler2D material_texture;
          uniform bool is_textured;
          uniform vec3 material_base_color;
          uniform float material_shininess;
      
          void main() {
            vec3 material_color = material_base_color;
            if (is_textured){
                vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
                material_color = frag_color_from_texture.xyz;
            }
            gl_FragColor = vec4(material_color, material_shininess);
          }
        `;
}
