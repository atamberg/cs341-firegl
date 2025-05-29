import { ShaderRenderer } from "./../shader_renderer.js";

export class NormalDeferredShaderRenderer extends ShaderRenderer {

    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `deferred/deferred.vert.glsl`,
            `deferred/deferred_buffer.frag.glsl`
        );
    }

    render(scene_state, gBuffer) {

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

            inputs.push({
                mesh: mesh,
                normalBuffer: gBuffer.color[1],

                mat_model_view_projection: mat_model_view_projection,
            });
        }

        this.pipeline(inputs);
    }

    exclude_object(obj) {
        return ['particles'].some(p => obj.material.properties.includes(p));
    }

    uniforms(regl) {
        return {
            buffer: regl.prop('normalBuffer'),

            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
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
