import { texture_data, light_to_cam_view } from "../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js"

export class ToonShaderRenderer extends ShaderRenderer {

    /**
     * Creates a renderer for toon shading
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
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
    render(scene_state){
        const scene = scene_state.scene;
        const inputs = [];

        let ambient_factor = scene.ambient_factor;

        // For every light in the scene we render the toon shading contributions
        scene.lights.forEach(light => {
            for (const obj of scene.objects) {
                // Check if object should be toon shaded
                if(this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const {texture, is_textured} = texture_data(obj, this.resource_manager);
                
                const { 
                    mat_model_view, 
                    mat_model_view_projection, 
                    mat_normals_model_view,
                    mat_model
                } = scene.camera.object_matrices.get(obj);
                
                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    mat_model_view_projection: mat_model_view_projection,
                    mat_model_view: mat_model_view,
                    mat_model: mat_model,
                    mat_normals_model_view: mat_normals_model_view,

                    light_position: light.position,
                    light_color: light.color,

                    ambient_factor: ambient_factor,

                    material_texture: texture,
                    is_textured: is_textured,
                    material_base_color: obj.material.color,
                    material_shininess: obj.material.shininess,

                    // Toon shading specific parameters
                    toon_levels: 4, // Number of discrete color levels
                    toon_scale: 1.0, // Scale factor for quantization
                    outline_threshold: 0.1 // Threshold for edge detection
                });
            }
            
            this.pipeline(inputs);
            // Set to 0 the ambient factor so it is only taken into account once during the first light render
            ambient_factor = 0;
        });
    }

    exclude_object(obj){
        // Do not shade objects that use other dedicated shader
        return obj.material.properties.includes('no_toon');
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
        // Additive blend mode
        return {
            enable: true,
            func: {
                src: 1,
                dst: 1,
            },
        };
    }

    uniforms(regl){
        return{
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_model: regl.prop('mat_model'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),
    
            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),

            // Ambient factor
            ambient_factor: regl.prop('ambient_factor'),
    
            // Material data
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),
            material_base_color: regl.prop('material_base_color'),
            material_shininess: regl.prop('material_shininess'),

            // Toon shading parameters
            toon_levels: regl.prop('toon_levels'),
            toon_scale: regl.prop('toon_scale'),
            outline_threshold: regl.prop('outline_threshold')
        };
    }
} 
