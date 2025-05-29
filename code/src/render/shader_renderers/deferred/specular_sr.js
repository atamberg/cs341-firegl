import { ShaderRenderer } from "./../shader_renderer.js";

export class SpecularDeferredShaderRenderer extends ShaderRenderer {

    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `deferred/deferred.vert.glsl`,
            `deferred/specular.frag.glsl`
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
                albedoSpecBuffer: gBuffer.color[0],

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
            buffer: regl.prop('albedoSpecBuffer'),

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
