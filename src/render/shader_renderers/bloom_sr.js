import { ShaderRenderer } from "./shader_renderer.js";
import { BlurShaderRenderer } from "./blur_sr.js";

export class BloomShaderRenderer extends ShaderRenderer {
    /**
     * @param {*} regl
     * @param {*} resource_manager
     */
    constructor(regl, resource_manager) {
        super(regl, resource_manager, 'bloom.vert.glsl', 'bloom.frag.glsl');
        
        // Create framebuffers for the bloom effect
        this.createFramebuffers(regl);
        
        // Create blur renderers (horizontal and vertical passes)
        this.horizontalBlur = new BlurShaderRenderer(regl, resource_manager, true);
        this.verticalBlur = new BlurShaderRenderer(regl, resource_manager, false);
        
        // Default bloom parameters
        this.brightPassThreshold = 0.6;
        this.blurSize = 9;
        this.blurSigma = 4.0;
    }
    
    /**
     * Create framebuffers needed for the bloom effect
     * @param {*} regl 
     */
    createFramebuffers(regl) {
        // Create framebuffers for the two-pass blur
        const createFbo = () => regl.framebuffer({
            color: regl.texture({
                width: regl._gl.canvas.width,
                height: regl._gl.canvas.height,
                format: 'rgba',
                wrap: 'clamp',
                type: 'uint8',
                mag: 'linear',
                min: 'linear'
            }),
            depth: true
        });
        
        this.brightPassFbo = createFbo();
        this.horizontalBlurFbo = createFbo();
        this.verticalBlurFbo = createFbo();
    }
    
    /**
     * Update bloom settings
     * @param {number} brightPassThreshold - Threshold for the bright pass filter
     * @param {number} blurSize - Size of the blur kernel (must be odd number)
     * @param {number} blurSigma - Sigma value for the gaussian function
     */
    setBloomParameters(brightPassThreshold, blurSize, blurSigma) {
        this.brightPassThreshold = brightPassThreshold;
        this.blurSize = blurSize;
        this.blurSigma = blurSigma;
        
        // Update blur renderers
        this.horizontalBlur.setBlurParameters(blurSize, blurSigma);
        this.verticalBlur.setBlurParameters(blurSize, blurSigma);
    }

    /**
     * @param {*} obj
     * @returns
     */
    exclude_object(obj) {
        // We only want to render to the screen quad
        return !obj.is_screen_quad;
    }

    /**
     * Override the default attributes 
     * @param {*} regl 
     * @returns attributes for the shader
     */
    attributes(regl) {
        return {
            vertex_positions: regl.prop('mesh.vertex_positions'),
            vertex_tex_coords: regl.prop('mesh.vertex_tex_coords'),
        };
    }

    /**
     * Define the blending for bloom
     */
    blend() {
        return {
            enable: true,
            func: {
                srcRGB: 'one',
                srcAlpha: 1,
                dstRGB: 'one',
                dstAlpha: 1
            }
        };
    }

    /**
     * Define the uniforms for the bloom shader
     * @param {*} regl 
     * @returns 
     */
    uniforms(regl) {
        return {
            u_texture: regl.texture({
                data: regl.prop('texture'),
                type: 'uint8',
                format: 'rgba'
            }),
            view_proj_matrix: regl.prop('view_proj_matrix'),
            model_matrix: regl.prop('model_matrix'),
            brightPassThreshold: () => this.brightPassThreshold
        };
    }

    /**
     * Apply the bloom effect to a scene
     * @param {*} scene_state - The state of the scene to render
     * @param {*} sourceTexture - The source texture to apply bloom to
     * @param {*} target_framebuffer - Optional framebuffer to render to (null for screen)
     */
    render(scene_state, sourceTexture, target_framebuffer = null) {
        // Resize framebuffers if the canvas size has changed
        if (this.brightPassFbo.width !== this.regl._gl.canvas.width || 
            this.brightPassFbo.height !== this.regl._gl.canvas.height) {
            this.createFramebuffers(this.regl);
        }
        
        // Step 1: Bright pass filter to extract bright areas
        this.applyBrightPass(scene_state, sourceTexture);
        
        // Step 2: Apply horizontal blur to the bright areas
        this.horizontalBlur.render(scene_state, this.brightPassFbo, this.horizontalBlurFbo);
        
        // Step 3: Apply vertical blur to the horizontally blurred result
        this.verticalBlur.render(scene_state, this.horizontalBlurFbo, this.verticalBlurFbo);
        
        // Step 4: Render the final bloom (additive blending with the original scene)
        this.renderFinalBloom(scene_state, this.verticalBlurFbo, target_framebuffer);
    }
    
    /**
     * Apply the bright pass filter to extract bright areas
     * @param {*} scene_state 
     * @param {*} sourceTexture 
     */
    applyBrightPass(scene_state, sourceTexture) {
        // Set the framebuffer for the bright pass
        this.regl({ framebuffer: this.brightPassFbo })(() => {
            // Clear the buffer
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            });

            // Use the resource manager's screen quad
            const screen_quad = this.resource_manager.screen_quad;

            // Draw the quad with our bloom shader
            this.pipeline({
                mesh: screen_quad.mesh,
                texture: sourceTexture,
                view_proj_matrix: screen_quad.view_proj_matrix,
                model_matrix: screen_quad.model_matrix,
            });
        });
    }
    
    /**
     * Render the final bloom effect
     * @param {*} scene_state 
     * @param {*} blurredTexture 
     * @param {*} target_framebuffer 
     */
    renderFinalBloom(scene_state, blurredTexture, target_framebuffer) {
        // Set the framebuffer if provided
        const framebuffer_option = target_framebuffer ? { framebuffer: target_framebuffer } : {};

        // Run the final additive blend
        this.regl(framebuffer_option)(() => {
            // Use the resource manager's screen quad
            const screen_quad = this.resource_manager.screen_quad;

            // Draw the blurred bloom with additive blending
            this.regl({
                framebuffer: target_framebuffer,
                blend: {
                    enable: true,
                    func: {
                        srcRGB: 'one',
                        srcAlpha: 1,
                        dstRGB: 'one',
                        dstAlpha: 1
                    }
                }
            })(() => {
                // Use a simple shader to render the blurred texture with additive blending
                this.pipeline({
                    mesh: screen_quad.mesh,
                    u_texture: blurredTexture,
                    view_proj_matrix: screen_quad.view_proj_matrix,
                    model_matrix: screen_quad.model_matrix,
                });
            });
        });
    }
    
    /**
     * Apply a full bloom effect as a post-processing step
     * @param {*} scene_state - Scene state with screen quad
     * @param {*} sourceTexture - Source scene texture
     * @param {*} brightPassThreshold - Threshold for bright pass filter
     * @param {*} blurSize - Size of blur kernel (must be odd)
     * @param {*} blurSigma - Sigma value for Gaussian blur
     */
    static applyBloomEffect(scene_state, sourceTexture, brightPassThreshold = 0.6, blurSize = 9, blurSigma = 4.0) {
        // Lazily initialize the bloom renderer if needed
        if (!scene_state.bloomRenderer) {
            scene_state.bloomRenderer = new BloomShaderRenderer(scene_state.regl, scene_state.resource_manager);
        }
        
        // Update bloom parameters
        scene_state.bloomRenderer.setBloomParameters(brightPassThreshold, blurSize, blurSigma);
        
        // Apply the bloom effect
        scene_state.bloomRenderer.render(scene_state, sourceTexture);
    }
}
