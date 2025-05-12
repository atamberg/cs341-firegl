import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";

export class BloomShaderRenderer extends ShaderRenderer {
    constructor(regl, resource_manager) {
        super(regl, resource_manager, "bloom_combine.vert.glsl", "bloom_combine.frag.glsl");
        
        // Create the bloom combine pass
        this.bloomCombine = this.regl({
            frag: this.resource_manager.get_shader("bloom_combine.frag.glsl"),
            vert: this.resource_manager.get_shader("bloom_combine.vert.glsl"),
            attributes: {
                a_position: [-1, -1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1],
                a_texCoord: [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
            },
            uniforms: {
                u_original: regl.prop('u_original'),
                u_bloom: regl.prop('u_bloom'),
                u_bloom_intensity: regl.prop('u_bloom_intensity'),
                u_exposure: regl.prop('u_exposure'),
            },
            count: 6,
            depth: { enable: false },
            blend: { enable: false }
        });

        // Create the bright pass filter
        this.brightPass = this.regl({
            frag: this.resource_manager.get_shader("light_extraction.frag.glsl"),
            vert: this.resource_manager.get_shader("light_extraction.vert.glsl"),
            attributes: {
                a_position: [-1, -1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1],
                a_texCoord: [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
            },
            uniforms: {
                u_input: regl.prop('u_input'),
                u_threshold: regl.prop('u_threshold'),
                u_intensity: regl.prop('u_intensity'),
            },
            count: 6,
            depth: { enable: false },
            blend: { enable: false }
        });

        // Create the gaussian blur pass
        this.gaussianBlur = this.regl({
            frag: this.resource_manager.get_shader("gaussian_blur.frag.glsl"),
            vert: this.resource_manager.get_shader("gaussian_blur.vert.glsl"),
            attributes: {
                a_position: [-1, -1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1],
                a_texCoord: [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
            },
            uniforms: {
                u_input: regl.prop('u_input'),
                u_blur_radius: regl.prop('u_blur_radius'),
                u_resolution: regl.prop('u_resolution'),
                u_horizontal: regl.prop('u_horizontal'),
            },
            count: 6,
            depth: { enable: false },
            blend: { enable: false }
        });
        
        // Create ping-pong framebuffers for the blur passes
        this.pingpongFBO = [null, null];
        this.pingpongBuffers = [null, null];
        
        // Initialize the ping-pong framebuffers
        this.initFramebuffers(regl);
    }
    
    // Initialize ping-pong framebuffers
    initFramebuffers(regl) {
        const width = regl._gl.drawingBufferWidth;
        const height = regl._gl.drawingBufferHeight;
        
        // Create persistent framebuffers
        this.pingpongFBO = [regl.framebuffer(), regl.framebuffer()];
        this.pingpongBuffers = [null, null];
        
        for (let i = 0; i < 2; i++) {
            this.pingpongBuffers[i] = regl.texture({
                width: width,
                height: height,
                format: 'rgba',
                type: 'float',
                min: 'linear',
                mag: 'linear',
                wrap: 'clamp'
            });
            
            this.pingpongFBO[i]({ color: this.pingpongBuffers[i], depth: false });
        }
        
        // Create a persistent bright pass framebuffer
        this.brightTexture = regl.texture({
            width: width,
            height: height,
            format: 'rgba',
            type: 'float',
            min: 'linear',
            mag: 'linear'
        });
        
        this.brightFramebuffer = regl.framebuffer({
            color: this.brightTexture,
            depth: false
        });
    }

    render(scene_state, baseTexture) {
        const { scene, regl } = scene_state;

        // Verify base texture exists
        if (!baseTexture) {
            console.error('Base texture not found for bloom effect');
            return;
        }

        // Get the canvas dimensions
        const width = regl._gl.drawingBufferWidth;
        const height = regl._gl.drawingBufferHeight;
        
        // Check if we need to recreate framebuffers (e.g., if window was resized)
        if (this.pingpongBuffers[0].width !== width || this.pingpongBuffers[0].height !== height) {
            this.initFramebuffers(regl);
        }
        
        // Get bloom parameters from UI with fallbacks
        const threshold = scene.ui_params.bloom_threshold || 0.6;
        const intensity = scene.ui_params.bloom_intensity || 1.5;
        const blurRadius = scene.ui_params.blur_radius || 2.0;
        const exposure = scene.ui_params.exposure || 1.0;

        // Step 1: Extract bright areas using the persistent bright pass framebuffer
        this.brightFramebuffer.use(() => {
            // Clear the framebuffer
            regl.clear({ color: [0, 0, 0, 0] });
            
            // Extract bright areas
            this.brightPass({
                u_input: baseTexture,
                u_threshold: threshold,
                u_intensity: intensity
            });
        });

        // Step 2: Apply two-pass Gaussian blur using ping-pong technique
        let horizontal = true;
        let firstIteration = true;
        const blurAmount = 5; // Number of blur passes (adjust as needed)
        
        for (let i = 0; i < blurAmount; i++) {
            // Bind the appropriate framebuffer
            this.pingpongFBO[horizontal ? 1 : 0].use(() => {
                // Clear the framebuffer
                regl.clear({ color: [0, 0, 0, 0] });
                
                // Apply blur in one direction
                this.gaussianBlur({
                    u_input: firstIteration ? this.brightTexture : this.pingpongBuffers[horizontal ? 0 : 1],
                    u_blur_radius: blurRadius,
                    u_resolution: [width, height],
                    u_horizontal: horizontal
                });
            });
            
            horizontal = !horizontal;
            if (firstIteration) {
                firstIteration = false;
            }
        }

        // Step 3: Combine the original image with the blurred bright areas
        this.bloomCombine({
            u_original: baseTexture,
            u_bloom: this.pingpongBuffers[horizontal ? 1 : 0], // Use the last rendered blur result
            u_bloom_intensity: intensity,
            u_exposure: exposure
        });
    }
}
