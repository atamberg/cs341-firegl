import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";

/**
 * The different noise function existing in the noise.frag.glsl
 */
export const noise_functions = {
    Plots_1d: "plots",
    Perlin: "tex_perlin",
    FBM: "tex_fbm",
    Turbulence: "tex_turbulence",
    Map: "tex_map",
    Wood: "tex_wood",
    FBM_for_terrain: "tex_fbm_for_terrain"
};


export class NoiseShaderRenderer extends ShaderRenderer {

    /**
     * Interface the noise shader and allow to choose which noise to compute
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `noise.vert.glsl`, 
            `noise.frag.glsl`
        );
    }

    /**
     * 
     * @param {*} mesh_quad_2d 
     * @param {*} noise_buffer 
     * @param {*} shader_func_name 
     * @param {*} viewer_scale 
     * @param {*} viewer_position 
     */
    render(mesh_quad_2d, noise_buffer, shader_func_name, viewer_scale, viewer_position){

        this.regl.clear({
            framebuffer: noise_buffer,
            color: [0, 0, 0, 1], 
        })

        const inputs = [];

        inputs.push({
            mesh_quad_2d: mesh_quad_2d,
            viewer_position : viewer_position,
            viewer_scale : viewer_scale,
            shader_frag : this.generate_frag_shader(shader_func_name),
            noise_buffer : noise_buffer,
        })

        this.pipeline(inputs);
    }

    /**
     * Complete the noise.frag.glsl file with the main function that called the 
     * desired noise function
     * @param {*} shader_func_name The noise function that needs to be called
     * @returns 
     */
    generate_frag_shader(shader_func_name) {

        return `${this.frag_shader}
    
        // --------------
                
        varying vec2 v2f_tex_coords;

        void main() {
        vec3 color = ${shader_func_name}(v2f_tex_coords);
        gl_FragColor = vec4(color, 1.0);
        }
        `;
    }

    // Overwrite the pipeline
    init_pipeline(){
        const regl = this.regl;

        return regl({
            attributes: {
                vertex_positions: regl.prop('mesh_quad_2d.vertex_positions')
            },

            elements: regl.prop('mesh_quad_2d.faces'),
            
            uniforms: {
                viewer_position: regl.prop('viewer_position'),
                viewer_scale:    regl.prop('viewer_scale'),
            },
                    
            vert: this.vert_shader,
            frag: regl.prop('shader_frag'),

            framebuffer: regl.prop('noise_buffer'),
        })
    } 

}