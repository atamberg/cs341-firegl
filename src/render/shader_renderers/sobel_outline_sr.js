import { ShaderRenderer } from "./shader_renderer.js"

export class SobelOutlineShaderRenderer extends ShaderRenderer {
    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `sobel_outline.vert.glsl`,
            `sobel_outline.frag.glsl`
        );

        // Create a full-screen quad
        this.quad = {
            vertex_positions: [
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1]
            ],
            vertex_tex_coords: [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1]
            ],
            faces: [
                [0, 1, 2],
                [0, 2, 3]
            ]
        };
    }

    render(scene_state) {
        const scene = scene_state.scene;
        const inputs = [];

        inputs.push({
            mesh: this.quad,
            depth_texture: scene_state.depth_texture,
            resolution: [scene_state.frame.framebufferWidth, scene_state.frame.framebufferHeight],
            outline_thickness: scene.ui_params.outline_thickness || 0.1,
            outline_color: scene.ui_params.outline_color || [0.0, 0.0, 0.0],
            depth_threshold: scene.ui_params.depth_threshold || 0.1
        });

        this.pipeline(inputs);
    }

    depth() {
        return {
            enable: false
        };
    }

    blend() {
        return {
            enable: true,
            func: {
                src: 'src alpha',
                dst: 'one minus src alpha'
            }
        };
    }

    uniforms(regl) {
        return {
            depth_texture: regl.prop('depth_texture'),
            resolution: regl.prop('resolution'),
            outline_thickness: regl.prop('outline_thickness'),
            outline_color: regl.prop('outline_color'),
            depth_threshold: regl.prop('depth_threshold')
        };
    }
} 