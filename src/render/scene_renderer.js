import { BlinnPhongShaderRenderer } from "./shader_renderers/blinn_phong_sr.js"
import { FlatColorShaderRenderer } from "./shader_renderers/flat_color_sr.js"
import { MirrorShaderRenderer } from "./shader_renderers/mirror_sr.js"
import { ShadowsShaderRenderer } from "./shader_renderers/shadows_sr.js"
import { MapMixerShaderRenderer } from "./shader_renderers/map_mixer_sr.js"
import { TerrainShaderRenderer } from "./shader_renderers/terrain_sr.js"
import { PreprocessingShaderRenderer } from "./shader_renderers/pre_processing_sr.js"
import { ResourceManager } from "../scene_resources/resource_manager.js"
import { ToonShaderRenderer } from "./shader_renderers/toon_sr.js"
import { ParticlesShaderRender } from "./shader_renderers/particles_sr.js"
import { SobelOutlineShaderRenderer } from "./shader_renderers/sobel_outline_sr.js"
import { GBufferShaderRenderer } from "./shader_renderers/deferred/gBuffer_sr.js"
import { BlinnPhongDeferredShaderRenderer } from "./shader_renderers/deferred/blinn_phong_deferred_sr.js"
import { ShadowsDeferredShaderRenderer } from "./shader_renderers/deferred/shadows_deferred_sr.js"
import { ToonDeferredShaderRenderer } from "./shader_renderers/deferred/toon_deferred_sr.js"
import { BloomShaderRenderer } from "./shader_renderers/bloom_sr.js"

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
        this.toon = new ToonShaderRenderer(regl, resource_manager);

        this.mirror = new MirrorShaderRenderer(regl, resource_manager);
        this.shadows = new ShadowsShaderRenderer(regl, resource_manager);
        this.map_mixer = new MapMixerShaderRenderer(regl, resource_manager);
        this.particles = new ParticlesShaderRender(regl, resource_manager);
        this.sobel_outline = new SobelOutlineShaderRenderer(regl, resource_manager);
        this.bloom = new BloomShaderRenderer(regl, resource_manager);

        // Create textures & buffer to save some intermediate renders into a texture
        this.create_texture_and_buffer("shadows", {}); 
        this.create_texture_and_buffer("base", {}); 
        this.create_texture_and_buffer("light", {});
        this.create_texture_and_buffer("bloom", {}); 

        // For deferred shading gBuffer
        this.gBuffer = this.regl.framebuffer({ color: [regl.texture({ type: 'float' }), regl.texture({ type: 'float' }), regl.texture({ type: 'float' })]});
        this.gBuffer.resize(window.innerWidth, window.innerHeight);

        this.gBuffer_renderer = new GBufferShaderRenderer(regl, resource_manager);
        this.blinn_phong_deferred = new BlinnPhongDeferredShaderRenderer(regl, resource_manager);
        this.shadows_deferred = new ShadowsDeferredShaderRenderer(regl, resource_manager);
        this.toon_deferred = new ToonDeferredShaderRenderer(regl, resource_manager);
    }

    /**
     * Helper function to create regl texture & regl buffers
     * @param {*} name the name for the texture (used to save & retrive data)
     * @param {*} options use if you need specific texture parameters
     */
    create_texture_and_buffer(name, options = {}){
        const regl = this.regl;
        const framebuffer_width = regl._gl.drawingBufferWidth;
        const framebuffer_height = regl._gl.drawingBufferHeight;
        const wrap = options.wrap || 'clamp';
        const format = options.format || 'rgba';
        const type = options.type || 'float';
        
        // Create a regl texture and a regl buffer linked to the regl texture
        const text = regl.texture({ 
            width: framebuffer_width, 
            height: framebuffer_height, 
            wrap: wrap, 
            format: format, 
            type: type
        });
        
        const buffer = regl.framebuffer({ 
            color: [text], 
            width: framebuffer_width, 
            height: framebuffer_height,
            depth: true,
            depthTexture: true
        });
        
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
        
        if (!texture || !buffer) {
            console.error(`Texture or buffer not found for ${name}`);
            return null;
        }

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
        if (!texture) {
            console.error(`Texture ${name} not found`);
            return null;
        }
        return texture;
    }

    /**
     * Core function to render a scene
     * Call the render passes in this function
     * @param {*} scene_state the description of the scene, time, dynamically modified parameters, etc.
     */
    render(scene_state) {
        // Inject regl into scene_state if needed
        scene_state.regl = this.regl;
        
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
        const baseTexture = this.render_in_texture("base", () =>{
            // Clear the framebuffer
            this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

            // Prepare the z_buffer and object with default black color
            this.pre_processing.render(scene_state);
            // Render the background
            this.flat_color.render(scene_state);

            // Render the terrain
            this.terrain.render(scene_state);
            if (scene.ui_params.deferred_shading) {
                this.gBuffer.use(() => {
                    this.regl.clear({
                        color: [0, 0, 0, 255],
                        depth: 1
                    })
                    this.gBuffer_renderer.render(scene_state);
                });

                // Render shaded objects - either with toon or blinn-phong shading
                if (scene.ui_params.toon_shading) {
                    this.toon_deferred.render(scene_state, this.gBuffer);
                } else {
                    this.blinn_phong_deferred.render(scene_state, this.gBuffer);
                }
            } else {
                // Render shaded objects - either with toon or blinn-phong shading
                if (scene.ui_params.toon_shading) {
                    this.toon.render(scene_state);
                } else {
                    this.blinn_phong.render(scene_state);
                }

                // Render the reflection of mirror objects on top
                //this.mirror.render(scene_state, (s_s) => {
                //    this.pre_processing.render(scene_state);
                //    this.flat_color.render(s_s);
                //    this.terrain.render(scene_state);
                //    if (scene.ui_params.toon_shading) {
                //        this.toon.render(s_s);
                //    } else {
                //        this.blinn_phong.render(s_s);
                //    }
                //});
            }
            // Render the background
            //this.flat_color.render(scene_state);

            // Render the terrain
            //this.terrain.render(scene_state);
            ////this.gBuffer_renderer.render(scene_state);
        })

        /*---------------------------------------------------------------
            2. Shadows Render Pass
        ---------------------------------------------------------------*/
        
        // Render the shadows of the scene in a black & white texture. White means shadow.
        this.render_in_texture("shadows", () =>{
            // Prepare the z_buffer and object with default black color
            this.pre_processing.render(scene_state);

            if (scene.ui_params.deferred_shading) {
                this.shadows_deferred.render(scene_state, this.gBuffer);
            } else {
                this.shadows.render(scene_state);
            }
            // Render the shadows
        })

        /*---------------------------------------------------------------
            3. Compositing
        ---------------------------------------------------------------*/

        // Mix the base color of the scene with the shadows information to create the final result
        this.map_mixer.render(scene_state, this.texture("shadows"), baseTexture);
        
        // Apply bloom effect if enabled
        if (scene.ui_params.bloom) {
            // Render the bloom effect directly to the screen
            this.bloom.render(scene_state, baseTexture);
        }        
        this.particles.render(scene_state);
        // Apply Sobel outline effect
        if (scene.ui_params.toon_shading) {
            this.sobel_outline.render({
                ...scene_state,
                depth_texture: baseTexture
            });
        }

        // Set default parameters for Sobel outline
        if (!scene.ui_params.depth_threshold) {
            scene.ui_params.depth_threshold = 0.05; // More selective edge detection
        }
        if (!scene.ui_params.outline_thickness) {
            scene.ui_params.outline_thickness = 0.1; // Thinner outlines
        }

        // render shadow buffer
        // this.shadows.render(scene_state);



        // Visualize cubemap
        // this.mirror.env_capture.visualize();
    }
}




