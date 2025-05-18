
import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { texture_data } from "../../../cg_libraries/cg_render_utils.js";
import { ShaderRenderer } from "./../shader_renderer.js";



export class GBufferShaderRenderer extends ShaderRenderer {

    /**
     * Used to render the mix between the 
     * two texture maps: shadows & blinn_phong colors
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        resource_manager.resources["gbuffer.vert.glsl"] = gbuffer_vertex_shader();
        resource_manager.resources["gbuffer.frag.glsl"] = gbuffer_fragment_shader();
        super(
            regl,
            resource_manager,
            `gbuffer.vert.glsl`,
            `gbuffer.frag.glsl`
        );
    }

    /**
     * Render result if the mix of the two texture passed as arguments
     * @param {*} scene_state 
     * @param {*} rendered_shadows a texture containing the shadows information
     * @param {*} rendered_blinn_phong a texture with the objects colors & shading 
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

function gbuffer_vertex_shader() {
    return `
        precision mediump float;

        attribute vec3 vertex_normal;
        attribute vec3 vertex_positions;
        attribute vec2 vertex_tex_coords;

        uniform mat4 mat_model_view;
        uniform mat4 mat_model_view_projection;
        uniform mat3 mat_normals_model_view;

        varying vec2 vTexture;
        varying vec4 vNormal;
        varying vec4 vPosition;

        void main() {
            vNormal = normalize(vec4(mat_normals_model_view * vertex_normal, 0.));
            vPosition = mat_model_view * vec4(vertex_positions, 1.);
            vTexture = vertex_tex_coords;
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
        }
        `;
}

function gbuffer_fragment_shader() {
    return `
        #extension GL_EXT_draw_buffers : require
        precision mediump float;

        varying vec2 vTexture;
        varying vec4 vPosition;
        varying vec4 vNormal;

        uniform sampler2D material_texture;
        uniform bool is_textured;
        uniform vec3 material_base_color;
        uniform float material_shininess;

        void main()
        {
            vec3 material_color = material_base_color;
            if (is_textured){
                material_color = texture2D(material_texture, vTexture).rgb;
            }
            gl_FragData[0] = vec4(material_color, material_shininess);

            gl_FragData[1] = normalize(vNormal);

            gl_FragData[2] = vPosition;
        }
        `;
}
