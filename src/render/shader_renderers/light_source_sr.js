import { texture_data, light_to_cam_view } from "../../cg_libraries/cg_render_utils.js"
import { ShaderRenderer } from "./shader_renderer.js"

export class LightSourceShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render a scene with the light source shader
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `light_source.vert.glsl`, 
            `light_source.frag.glsl`
        );
    }

    /**
     * Override the attributes method to provide the necessary vertex attributes
     * @param {*} regl 
     * @returns 
     */
    attributes(regl){
        return {
            vertex_positions: regl.prop('mesh.vertex_positions'),
            vertex_normal: regl.prop('mesh.vertex_normals'),
            vertex_tex_coords: regl.prop('mesh.vertex_tex_coords')
        };
    }
    
    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state){
        const scene = scene_state.scene;
        const inputs = [];

        // For every light in the scene we render the light source
        scene.lights.forEach(light => {
            // Transform light position into camera space
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);

            // For each object with light source material
            scene.objects.forEach(obj => {
                if(this.exclude_object(obj)) return;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const {texture, is_textured} = texture_data(obj, this.resource_manager);
                
                const { 
                    mat_model_view, 
                    mat_model_view_projection, 
                    mat_normals_model_view 
                } = scene.camera.object_matrices.get(obj);
                
                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    mat_model_view_projection: mat_model_view_projection,
                    mat_model_view: mat_model_view,
                    mat_normals_model_view: mat_normals_model_view,

                    light_position: light_position_cam,
                    light_color: light.color,
                    ambient_factor: scene.ambient_factor,

                    material_texture: texture,
                    is_textured: is_textured,
                });
            });
        });
        
        this.pipeline(inputs);
    }

    exclude_object(obj){
        // Only render objects with light source material
        return !obj.material.properties.includes('light_source');
    }

    depth(){
        // Use z buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    blend(){
        // Additive blend mode for the light source
        return {
            enable: true,
            func: {
                src: 1,
                dst: 1,
            }
        };
    }

    uniforms(regl){
        return {
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),
            ambient_factor: regl.prop('ambient_factor'),
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured')
        };
    }
}
