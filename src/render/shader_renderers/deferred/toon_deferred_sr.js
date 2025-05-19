import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { texture_data, light_to_cam_view } from "../../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./../shader_renderer.js"

export class ToonDeferredShaderRenderer extends ShaderRenderer {

    /**
     * Creates a renderer for toon shading
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        resource_manager.resources["toon_deferred.vert.glsl"] = toon_deferred_vertex_shader();
        resource_manager.resources["toon_deferred.frag.glsl"] = toon_deferred_fragment_shader();
        super(
            regl,
            resource_manager,
            `toon_deferred.vert.glsl`,
            `toon_deferred.frag.glsl`
        );
    }

    /**
     * Render the objects of the scene_state with toon shading
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {
        const scene = scene_state.scene;
        const inputs = [];

        let ambient_factor = scene.ambient_factor;

        // For every light in the scene we render the toon shading contributions
        scene.lights.forEach(light => {
            for (const obj of scene.objects) {
                // Check if object should be toon shaded
                if (this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const { texture, is_textured } = texture_data(obj, this.resource_manager);

                const {
                    mat_model_view,
                    mat_model_view_projection,
                    mat_normals_model_view
                } = scene.camera.object_matrices.get(obj);

                const mat_model = mat4.create();
                mat4.fromTranslation(mat_model, obj.translation);
                mat4.scale(mat_model, mat_model, obj.scale);

                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    albedoSpecBuffer: gBuffer.color[0],
                    normalBuffer: gBuffer.color[1],
                    positionBuffer: gBuffer.color[2],

                    mat_model_view_projection: mat_model_view_projection,
                    mat_model: mat_model,

                    light_position: light.position,
                    light_color: light.color,

                    ambient_factor: ambient_factor,

                    // Toon shading specific parameters
                    toon_levels: scene.ui_params.toon_levels || 7, // Number of discrete color levels
                    outline_threshold: scene.ui_params.outline_threshold || 0.2, // Threshold for edge detection
                    outline_color: scene.ui_params.outline_color || [0.0, 0.0, 0.0], // Black outline by default
                });
            }

            this.pipeline(inputs);
            // Set to 0 the ambient factor so it is only taken into account once during the first light render
            ambient_factor = 0;
        });
    }

    exclude_object(obj) {
        // Do not shade objects that use other dedicated shader
        return obj.material.properties.includes('no_toon');
    }
    depth() {
        // Use z buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    blend() {
        // Additive blend mode
        return {
            enable: true,
            func: {
                src: 1,
                dst: 1,
            },
        };
    }

    uniforms(regl) {
        return {
            // gBuffer stuff
            albedoSpecBuffer: regl.prop('albedoSpecBuffer'),
            normalBuffer: regl.prop('normalBuffer'),
            positionBuffer: regl.prop('positionBuffer'),

            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model: regl.prop('mat_model'),

            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),

            // Ambient factor
            ambient_factor: regl.prop('ambient_factor'),

            // Toon shading parameters
            toon_levels: regl.prop('toon_levels'),
            outline_threshold: regl.prop('outline_threshold'),
            outline_color: regl.prop('outline_color'),
        };
    }
} 

function toon_deferred_vertex_shader() {
    return `
        precision mediump float;

        // Vertex attributes
        attribute vec3 vertex_positions;
        attribute vec3 vertex_normal;

        // Varying values passed to the fragment shader
        varying vec3 v2f_world_pos;
        varying vec3 v2f_world_normal;

        varying vec4 vPosition;

        // Global uniform variables
        uniform mat4 mat_model_view_projection;
        uniform mat4 mat_model;  // Model matrix for world space transformation

        void main()
        {
            // Calculate world space position
            v2f_world_pos = (mat_model * vec4(vertex_positions, 1.0)).xyz;

            // Calculate world space normal
            v2f_world_normal = (mat_model * vec4(vertex_normal, 0.0)).xyz;

            // Calculate final vertex position on the canvas
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
            vPosition = gl_Position;
        }`
}

function toon_deferred_fragment_shader() {
    return `
        precision mediump float;

        // Varying values passed from the vertex shader
        varying vec3 v2f_world_pos;        // Fragment position in world space
        varying vec3 v2f_world_normal;     // Normal vector in world space
        varying vec3 v2f_light_dir;        // Direction to light in world space
        varying vec4 vPosition;

        // Global variables specified in "uniforms" entry of the pipeline
        uniform vec3 light_color;          // Color of the light
        uniform vec3 light_position;       // Position of the light in world space
        uniform float ambient_factor;      // How much ambient light to apply

        // Toon shading parameters
        uniform int toon_levels;           // Number of discrete color bands
        uniform float outline_threshold;   // Threshold for outline detection
        uniform vec3 outline_color;        // Color of the outline

        uniform sampler2D positionBuffer, normalBuffer, albedoSpecBuffer;

        void main()
        {
            // vertex position on canvas
            vec2 uv = (vPosition.xy / vPosition.w ) * 0.5 + 0.5;
            vec3 v2f_frag_pos = texture2D(positionBuffer, uv).xyz;
            vec3 v2f_normal = texture2D(normalBuffer, uv).xyz;
            vec3 material_color = texture2D(albedoSpecBuffer, uv).rgb;
            float material_shininess = texture2D(albedoSpecBuffer, uv).a;

            // Calculate light direction in world space
            vec3 v2f_light_dir = light_position - v2f_world_pos;

            // Normalize vectors for lighting calculations
            vec3 normal = normalize(v2f_world_normal);
            vec3 light_dir = normalize(v2f_light_dir);
            vec3 view_dir = normalize(-v2f_frag_pos);
            
            // Calculate diffuse lighting (how much light hits the surface)
            float diffuse = max(0.0, dot(normal, light_dir));
            
            // Quantize the diffuse value to create discrete color bands
            float diffuse_floor = floor(diffuse * float(toon_levels)) / float(toon_levels);
            float diffuse_ceil = diffuse_floor + (1. / float(toon_levels));
            diffuse = diffuse_floor + (diffuse_ceil - diffuse_floor) / 2.;

            // Calculate specular lighting (shiny highlights)
            vec3 half_dir = normalize(light_dir + view_dir);
            float specular = pow(max(0.0, dot(normal, half_dir)), material_shininess);
            
            // Quantize the specular value to match the toon style
            float specular_floor = floor(specular * float(toon_levels)) / float(toon_levels);
            float specular_ceil = specular_floor + (1. / float(toon_levels));
            specular = specular_floor + (specular_ceil - specular_floor) / 2.;

            // Calculate ambient lighting (base level of light everywhere)
            vec3 ambient = ambient_factor * material_color;

            // Check for outline
            float outline = 0.0;
            vec3 view_normal = normalize(v2f_normal);
            vec3 view_frag_pos = normalize(v2f_frag_pos);
            float edge = 1.0 - dot(view_normal, view_frag_pos);
            // Combine all lighting components to get final color
            vec3 color = ambient + light_color * material_color * (diffuse + specular);
            
            gl_FragColor = vec4(color, 1.0);
        } 
`
}
