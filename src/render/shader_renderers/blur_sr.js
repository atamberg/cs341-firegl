import { ShaderRenderer } from "./shader_renderer.js";

export class BlurShaderRenderer extends ShaderRenderer {
    /**
     * @param {*} regl
     * @param {*} resource_manager
     * @param {boolean} horizontalPass - Whether this is a horizontal pass (true) or vertical pass (false)
     */
    constructor(regl, resource_manager, horizontalPass = true) {
        super(regl, resource_manager, 'blur.vert.glsl', 'blur.frag.glsl');
        this.horizontalPass = horizontalPass;
        this.blurSize = 9; // Default blur size (must be odd number)
        this.sigma = 4.0; // Default sigma value for 9x9 blur
        
        // Create framebuffers
        this.createFramebuffers(regl);
        
        // Create a screen quad for post-processing
        this.setupScreenQuad(regl);
    }

    /**
     * Create framebuffers for blur passes
     * @param {*} regl 
     */
    createFramebuffers(regl) {
        // Create the texture
        const texture = regl.texture({
            width: regl._gl.canvas.width,
            height: regl._gl.canvas.height,
            format: 'rgba',
            wrap: 'clamp',
            mag: 'linear',
            min: 'linear'
        });

        // Create the framebuffer
        this.blurFbo = regl.framebuffer({
            color: [texture],
            width: regl._gl.canvas.width,
            height: regl._gl.canvas.height,
            depth: true,
            depthStencil: false
        });

        // Validate framebuffer completeness
        regl._gl.bindFramebuffer(regl._gl.FRAMEBUFFER, this.blurFbo.framebuffer);
        const status = regl._gl.checkFramebufferStatus(regl._gl.FRAMEBUFFER);
        if (status !== regl._gl.FRAMEBUFFER_COMPLETE) {
            console.error('Blur framebuffer not complete:', status);
        }
        regl._gl.bindFramebuffer(regl._gl.FRAMEBUFFER, null);
    }
    
    /**
     * Create a screen quad for post-processing effects
     * @param {*} regl 
     */
    setupScreenQuad(regl) {
        // Screen quad vertices (2 triangles forming a quad)
        this.screenQuad = {
            mesh: {
                vertex_positions: regl.buffer([
                    [-1, -1, 0], // Bottom-left
                    [1, -1, 0],  // Bottom-right
                    [-1, 1, 0],  // Top-left
                    [1, 1, 0]    // Top-right
                ]),
                vertex_tex_coords: regl.buffer([
                    [0, 0],
                    [1, 0],
                    [0, 1],
                    [1, 1]
                ]),
                faces: regl.elements([
                    [0, 1, 2], // First triangle (bottom-left, bottom-right, top-left)
                    [2, 1, 3]  // Second triangle (top-left, bottom-right, top-right)
                ])
            },
            model_matrix: [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ],
            view_proj_matrix: [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]
        };
    }

    /**
     * Update blur settings
     * @param {number} blurSize - Size of the blur kernel (must be odd number)
     * @param {number} sigma - Sigma value for the gaussian function
     */
    setBlurParameters(blurSize, sigma) {
        this.blurSize = blurSize;
        this.sigma = sigma;
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
     * We want to blend the blurred result
     */
    blend() {
        return {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one minus src alpha',
                dstAlpha: 1
            }
        };
    }

    /**
     * Define the uniforms for the blur shader
     * @param {*} regl 
     * @returns 
     */
    uniforms(regl) {
        return {
            u_texture: regl.prop('texture'),
            view_proj_matrix: regl.prop('view_proj_matrix'),
            model_matrix: regl.prop('model_matrix'),
            horizontalPass: () => this.horizontalPass ? 1 : 0,
            blurSize: () => this.blurSize,
            sigma: () => this.sigma,
            texOffset: (context) => {
                return [1.0 / context.framebufferWidth, 1.0 / context.framebufferHeight];
            }
        };
    }

    /**
     * Render a scene with this shader
     * @param {*} scene_state - The state of the scene to render
     * @param {*} texture - The texture to blur
     * @param {*} target_framebuffer - Optional framebuffer to render to
     */
    render(scene_state, texture, target_framebuffer = null) {
        // Run the blur shader
        this.regl({ framebuffer: target_framebuffer || this.regl._gl.canvas })(() => {
            // Clear the buffer
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            });

            this.applyBlur(this.regl, texture);
        });
    }

    applyBlur(regl, sourceTexture) {
        // Set up the framebuffer
        this.regl({ framebuffer: this.blurFbo })(() => {
            // Clear the buffer
            regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            });

            // Draw the quad with our blur shader
            this.pipeline({
                mesh: this.screenQuad.mesh,
                texture: sourceTexture,
                view_proj_matrix: this.screenQuad.view_proj_matrix,
                model_matrix: this.screenQuad.model_matrix,
                blurSize: this.blurSize,
                horizontalPass: this.horizontalPass ? 1 : 0,
                sigma: this.sigma
            });
        });
    }
}
