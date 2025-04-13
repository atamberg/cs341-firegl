
import { BlinnPhongShaderRenderer } from "./shader_renderers/blinn_phong_sr.js"
import { FlatColorShaderRenderer } from "./shader_renderers/flat_color_sr.js"
import { MirrorShaderRenderer } from "./shader_renderers/mirror_sr.js"
import { ShadowsShaderRenderer } from "./shader_renderers/shadows_sr.js"
import { MapMixerShaderRenderer } from "./shader_renderers/map_mixer_sr.js"
import { TerrainShaderRenderer } from "./shader_renderers/terrain_sr.js"
import { PreprocessingShaderRenderer } from "./shader_renderers/pre_processing_sr.js"
import { ResourceManager } from "../scene_resources/resource_manager.js"

export class SceneRenderer {

    /** 
     * Create a new scene render to display a scene on the screen
     * @param {*} regl the canvas to draw on 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        this.regl = regl;
        this.resource_manager = resource_manager;

        this.textures_and_buffers = {};

        // Creates the renderer object for each shader kind
        this.pre_processing = new PreprocessingShaderRenderer(regl, resource_manager);

        this.flat_color = new FlatColorShaderRenderer(regl, resource_manager);
        this.blinn_phong = new BlinnPhongShaderRenderer(regl, resource_manager);
        this.terrain = new TerrainShaderRenderer(regl, resource_manager);

        this.mirror = new MirrorShaderRenderer(regl, resource_manager);
        this.shadows = new ShadowsShaderRenderer(regl, resource_manager);
        this.map_mixer = new MapMixerShaderRenderer(regl, resource_manager);

        // Create textures & buffer to save some intermediate renders into a texture
        this.create_texture_and_buffer("shadows", {}); 
        this.create_texture_and_buffer("base", {}); 
    }

    /**
     * Helper function to create regl texture & regl buffers
     * @param {*} name the name for the texture (used to save & retrive data)
     * @param {*} parameters use if you need specific texture parameters
     */
    create_texture_and_buffer(name, {wrap = 'clamp', format = 'rgba', type = 'float'}){
        const regl = this.regl;
        const framebuffer_width = window.innerWidth;
        const framebuffer_height = window.innerHeight;

        // Create a regl texture and a regl buffer linked to the regl texture
        const text = regl.texture({ width: framebuffer_width, height: framebuffer_height, wrap: wrap, format: format, type: type })
        const buffer = regl.framebuffer({ color: [text], width: framebuffer_width, height: framebuffer_height, })
        
        this.textures_and_buffers[name] = [text, buffer]; 
    }

    /**
     * Function to run a rendering process and save the result in the designated texture
     * @param {*} name of the texture to render in
     * @param {*} render_function that is used to render the result to be saved in the texture
     * @returns 
     */
    render_in_texture(name, render_function){
        const regl = this.regl;
        const [texture, buffer] = this.textures_and_buffers[name];
        regl({ framebuffer: buffer })(() => {
            regl.clear({ color: [0,0,0,1], depth: 1 });
            render_function();
          });
        return texture;
    }

    /**
     * Retrieve a render texture with its name
     * @param {*} name 
     * @returns 
     */
    texture(name){
        const [texture, buffer] = this.textures_and_buffers[name];
        return texture;
    }

    /**
     * Core function to render a scene
     * Call the render passes in this function
     * @param {*} scene_state the description of the scene, time, dynamically modified parameters, etc.
     */
    render(scene_state) {
        
        const scene = scene_state.scene;
        const frame = scene_state.frame;

        /*---------------------------------------------------------------
            0. Camera Setup
        ---------------------------------------------------------------*/

        // Update the camera ratio in case the windows size changed
        scene.camera.update_format_ratio(frame.framebufferWidth, frame.framebufferHeight);
        
        // Compute the objects matrices at the beginning of each frame
        // Note: for optimizing performance, some matrices could be precomputed and shared among different objects
        scene.camera.compute_objects_transformation_matrices(scene.objects);

        /*---------------------------------------------------------------
            1. Base Render Passes
        ---------------------------------------------------------------*/

        // Render call: the result will be stored in the texture "base"
        this.render_in_texture("base", () =>{

            // Prepare the z_buffer and object with default black color
            this.pre_processing.render(scene_state);

            // Render the background
            this.flat_color.render(scene_state);

            // Render the terrain
            this.terrain.render(scene_state);

            // Render shaded objects
            this.blinn_phong.render(scene_state);

            // Render the reflection of mirror objects on top
            this.mirror.render(scene_state, (s_s) => {
                this.pre_processing.render(scene_state);
                this.flat_color.render(s_s);
                this.terrain.render(scene_state);
                this.blinn_phong.render(s_s);
            });
        })

        /*---------------------------------------------------------------
            2. Shadows Render Pass
        ---------------------------------------------------------------*/
        
        // Render the shadows of the scene in a black & white texture. White means shadow.
        this.render_in_texture("shadows", () =>{

            // Prepare the z_buffer and object with default black color
            this.pre_processing.render(scene_state);

            // Render the shadows
            this.shadows.render(scene_state);
        })

        /*---------------------------------------------------------------
            3. Compositing
        ---------------------------------------------------------------*/

        // Mix the base color of the scene with the shadows information to create the final result
        this.map_mixer.render(scene_state, this.texture("shadows"), this.texture("base"));

        // Visualize cubemap
        // this.mirror.env_capture.visualize();

    }
}




