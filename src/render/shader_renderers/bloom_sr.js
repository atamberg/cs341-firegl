import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";

export class BloomShaderRenderer extends ShaderRenderer {
    constructor(regl, resource_manager) {
        super(regl, resource_manager, "bloom_combine.vert.glsl", "bloom_combine.frag.glsl");
        
        this.bloomCombine = this.regl({
            frag: this.resource_manager.get_shader("bloom_combine.frag.glsl"),
            vert: this.resource_manager.get_shader("bloom_combine.vert.glsl"),
            attributes: {
                a_position: [-4, -4, 4, -4, 0, 4, -4, 4, 4, 4, 0, 4],
                a_texCoord: [0, 0, 1, 0, 0.5, 1, 0, 1, 1, 1, 0.5, 0],
            },
            uniforms: {
                u_original: regl.texture(),
                u_bloom: regl.texture(),
                u_bloom_intensity: regl.prop('u_bloom_intensity'),
            },
            count: 6,
        });

        this.lightExtraction = this.regl({
            frag: this.resource_manager.get_shader("light_extraction.frag.glsl"),
            vert: this.resource_manager.get_shader("light_extraction.vert.glsl"),
            attributes: {
                a_position: [-4, -4, 4, -4, 0, 4, -4, 4, 4, 4, 0, 4],
                a_texCoord: [0, 0, 1, 0, 0.5, 1, 0, 1, 1, 1, 0.5, 0],
            },
            uniforms: {
                u_input: regl.prop('input'),
                u_threshold: regl.prop('threshold'),
                u_intensity: regl.prop('intensity'),
            },
            count: 6,
        });

        this.gaussianBlur = this.regl({
            frag: this.resource_manager.get_shader("gaussian_blur.frag.glsl"),
            vert: this.resource_manager.get_shader("gaussian_blur.vert.glsl"),
            attributes: {
                a_position: [-4, -4, 4, -4, 0, 4, -4, 4, 4, 4, 0, 4],
                a_texCoord: [0, 0, 1, 0, 0.5, 1, 0, 1, 1, 1, 0.5, 0],
            },
            uniforms: {
                u_input: regl.texture(),
                u_blur_radius: regl.prop('u_blur_radius'),
                u_resolution: regl.prop('u_resolution'),
            },
            count: 6,
        });
    }

    render(scene_state, baseTexture) {
        const { scene, regl } = scene_state;
        const width = regl._gl.drawingBufferWidth;
        const height = regl._gl.drawingBufferHeight;
        // Create framebuffer for bloom extraction
        const bloomFramebuffer = regl.framebuffer({
            color: regl.renderbuffer({
                width,
                height,
                format: 'rgba32f',
                type: 'float'
            }),
            width,
            height,
            depth: false,
            depthTexture: true
        });
        // Bind the framebuffer using .use()
        bloomFramebuffer.use(() => {
            regl.clear({ color: [0, 0, 0, 1], depth: 1 });
    
            // Light extraction render pass
            this.lightExtraction({
                input: baseTexture,
                threshold: scene.ui_params.bloom_threshold,
                intensity: scene.ui_params.bloom_intensity,
            });
    
            // Gaussian blur pass (could use separate framebuffer for ping-ponging)
            this.gaussianBlur({
                u_input: bloomFramebuffer.color[0],
                u_blur_radius: parseFloat(scene.ui_params.blur_radius),
                u_resolution: [width, height],
            });
        });
    
        // Final composition with bloom
        this.bloomCombine({
            u_original: baseTexture,
            u_bloom: bloomFramebuffer.color[0],
            u_bloom_intensity: 1.0,
        });
    }
}
