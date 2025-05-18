import { mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js";
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";


export class PositionShaderRenderer extends ShaderRenderer {

    constructor(regl, resource_manager) {
        resource_manager.resources["position.vert.glsl"] = position_vertex_shader();
        resource_manager.resources["position.frag.glsl"] = position_fragment_shader();

        super(
            regl,
            resource_manager,
            `position.vert.glsl`,
            `position.frag.glsl`
        );
    }

    render(scene_state) {

        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view
            } = scene.camera.object_matrices.get(obj);

            const mat_model_to_world = mat4.create();
            mat4.fromTranslation(mat_model_to_world, obj.translation);
            mat4.scale(mat_model_to_world, mat_model_to_world, obj.scale);

            inputs.push({
                mesh: mesh,

                mat_model_view_projection: mat_model_view_projection,
                mat_model_to_world: mat_model_to_world,
            });
        }

        this.pipeline(inputs);
    }

    uniforms(regl) {
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_to_world: regl.prop('mat_model_to_world'),
        };
    }

    depth() {
        // Use the z-buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }
}

// Hard coded shaders, equivalent to defining them in a separate glsl file

function position_vertex_shader() {
    return `
          precision mediump float;
      
          attribute vec3 vertex_positions;
          uniform mat4 mat_model_view_projection;
          uniform mat4 mat_model_to_world;

          varying vec4 vColor;
      
          void main() {
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
            vColor = mat_model_to_world * vec4(vertex_positions, 1.);
          }
        `;
}

function position_fragment_shader() {
    return `
          precision mediump float;

          varying vec4 vColor;
      
          void main() {
            gl_FragColor = vColor;
          }
        `;
}
