import { mat4 } from "../../../../lib/gl-matrix_3.3.0/esm/index.js";
import { mat4_matmul_many } from "../../../cg_libraries/cg_math.js";
import { vec4FromVec3 } from "../../../cg_libraries/cg_math.js";
import { texture_data, light_to_cam_view } from "../../../cg_libraries/cg_render_utils.js"
import { cg_mesh_make_uv_sphere } from "../../../cg_libraries/cg_mesh.js";
import { ResourceManager } from "../../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./../shader_renderer.js"

export class ToonDeferredShaderRenderer extends ShaderRenderer {

    /**
     * Creates a renderer for toon shading
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        resource_manager.resources["toon_deferred.frag.glsl"] = toon_deferred_fragment_shader();
        super(
            regl,
            resource_manager,
            `deferred.vert.glsl`,
            `toon_deferred.frag.glsl`
        );
        this.light_sphere = cg_mesh_make_uv_sphere(16);
    }

    /**
     * Render the objects of the scene_state with toon shading
     * @param {*} scene_state 
     */
    render(scene_state, gBuffer) {
        const scene = scene_state.scene;

        const mat_model_view_projection = mat4.create();

        const mat_model = mat4.create();

        scene.lights.forEach(light => {
            const inputs = [];
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view)
            const radius = light.radius;

            mat4.fromTranslation(mat_model, vec4FromVec3(light.position, 1));
            mat4.scale(mat_model, mat_model, [radius, radius, radius]);
            mat4_matmul_many(mat_model_view_projection, scene.camera.mat.projection, scene.camera.mat.view, mat_model);

            inputs.push({
                mesh: this.light_sphere,
                albedoSpecBuffer: gBuffer.color[0],
                normalBuffer: gBuffer.color[1],
                positionBuffer: gBuffer.color[2],

                mat_model_view_projection: mat_model_view_projection,

                light_color: light.color,
                light_position: light_position_cam,
                light_radius: radius,

                // Toon shading specific parameters
                toon_levels: scene.ui_params.toon_levels || 7, // Number of discrete color levels
                outline_threshold: scene.ui_params.outline_threshold || 0.2, // Threshold for edge detection
                outline_color: scene.ui_params.outline_color || [0.0, 0.0, 0.0], // Black outline by default
            });

            this.pipeline(inputs);
        });
    }

    depth() {
        // Use z buffer
        return {
            enable: false,
        };
    }

    cull() {
        // draw back face
        return { enable: true, face: 'back' }; 
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
            light_radius: regl.prop('light_radius'),

            // Toon shading parameters
            toon_levels: regl.prop('toon_levels'),
            outline_threshold: regl.prop('outline_threshold'),
            outline_color: regl.prop('outline_color'),
        };
    }
} 

function toon_deferred_fragment_shader() {
    return `
        precision mediump float;

        // Varying values passed from the vertex shader
        varying vec3 v2f_light_dir;        // Direction to light in world space
        varying vec4 vPosition;

        // Global variables specified in "uniforms" entry of the pipeline
        uniform vec3 light_color;          // Color of the light
        uniform vec3 light_position;       // Position of the light in world space
        uniform float light_radius;        // Radius of the light

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

            // Normalize vectors for lighting calculations
            vec3 normal = normalize(v2f_normal);
            vec3 light_dir = normalize(light_position - v2f_frag_pos);
            vec3 view_dir = normalize(-v2f_frag_pos);

            // Calculate specular lighting (shiny highlights)
            vec3 half_dir = normalize(light_dir + view_dir);

            float h_dot_n = clamp(dot(half_dir, normal), 1e-12, 1.);
            
            // Calculate diffuse lighting (how much light hits the surface)
            float diffuse = max(0.0, dot(normal, light_dir));

            float specular = diffuse > 0. ? pow(h_dot_n, material_shininess) : 0.;

            // Quantize the diffuse value to create discrete color bands
            float diffuse_floor = floor(diffuse * float(toon_levels)) / float(toon_levels);
            float diffuse_ceil = diffuse_floor + (1. / float(toon_levels));
            diffuse = diffuse_floor + (diffuse_ceil - diffuse_floor) / 2.;
            
            // Quantize the specular value to match the toon style
            float specular_floor = floor(specular * float(toon_levels)) / float(toon_levels);
            float specular_ceil = specular_floor + (1. / float(toon_levels));
            specular = specular_floor + (specular_ceil - specular_floor) / 2.;

            float light_distance = length(light_position - v2f_frag_pos);
            float attenuation = max(0., 1.0 - light_distance / light_radius);

            // Check for outline
            //float outline = 0.0;
            //vec3 view_normal = normalize(v2f_normal);
            //vec3 view_frag_pos = normalize(v2f_frag_pos);
            //float edge = 1.0 - dot(view_normal, view_frag_pos);
            // Combine all lighting components to get final color
            vec3 color = attenuation * light_color * material_color * (diffuse + specular);
            
            gl_FragColor = vec4(color, 1.0);
        } 
`
}
