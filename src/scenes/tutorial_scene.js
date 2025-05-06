import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere, cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action,
  create_button
} from "../cg_libraries/cg_web.js";
import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";
import { RainbowVomitParticles } from "../scene_resources/rainbow_vomit_particles.js";

export class TutorialScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;

    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene(){

    // TODO
    this.static

    // Original light source position
    const originalLightPosition = [0.0, -2.0, 2.5];
    const sphereLightPosition = [1.5, 1.5, 2];
    
    // Add light source based on bloom toggle
    if (this.ui_params.bloom) {
        // When bloom is true, use the sphere as light source
        this.lights.push({
            position: sphereLightPosition,
            color: [1.0, 0.9, 0.8]
        });
    } else {
        // When bloom is false, use the original light source
        this.lights.push({
            position: originalLightPosition,
            color: [1.0, 1.0, 0.9]
        });
    }

    this.objects.push({
      translation: [0,0,0],
      scale: [1,1,1],
      mesh_reference: 'pine.obj',
      material: MATERIALS.pine,
    })

    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", cg_mesh_make_uv_sphere(16));
    this.resource_manager.add_procedural_mesh("light_sphere", cg_mesh_make_uv_sphere(32));
    this.resource_manager.add_procedural_mesh("billboard", cg_mesh_make_plane());
    this.resource_manager.add_procedural_mesh("ground", cg_mesh_make_plane());

    this.objects.push({
      translation: [0, 0, 0],
      scale: [80., 80., 80.],
      mesh_reference: 'mesh_sphere_env_map',
      material: MATERIALS.sunset_sky
    });

    this.objects.push({
      translation: [0, 0, 2],
      scale: [0.5, 0.5, 0.5],
      mesh_reference: 'billboard',
      material: MATERIALS.billboard,
    });

    // Add light source sphere
    this.objects.push({
      translation: [1.5, 1.5, 2],
      scale: [0.2, 0.2, 0.2],
      mesh_reference: 'light_sphere',
      material: {
        color: [1.0, 0.9, 0.8],
        properties: ['emissive', 'no_blinn_phong'],
        shininess: 100
      }
    });

    // Make the sphere glow when bloom is true
    if (this.ui_params.bloom) {
        this.objects[this.objects.length - 1].material.properties.push('glow');
    }

    this.objects.push({
      translation: [0, 0, 0],
      scale: [1, 1, 1],
      mesh_reference: 'ground',
      material: MATERIALS.gray,
    });

    const vomit = new RainbowVomitParticles([0,0,2], [0.01,0.01,0.01], 'billboard');
    this.objects.push(vomit);
    this.actors["vomit"] = vomit;

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){

    // TODO

  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params(){
    // Initialize toon shading parameters with optimal defaults
    this.ui_params.toon_levels = 4;        // Number of discrete color bands (7 gives good balance)
    this.ui_params.toon_scale = 0.7;       // Scale factor (0.7 preserves color intensity well)
    this.ui_params.outline_threshold = 0.2; // Fixed outline threshold
    this.ui_params.outline_color = [0.0, 0.0, 0.0]; // Black outlines
    this.ui_params.depth_threshold = 0.1;

    // Add bloom toggle
    this.ui_params.bloom = false; // Start with original light source

    // Original light source position
    const originalLightPosition = [0.0, -2.0, 2.5];
    const sphereLightPosition = [1.5, 1.5, 2];

    // Function to update light source based on bloom state
    const updateLightSource = () => {
      // Clear existing lights
      this.lights = [];

      // Add new light source based on bloom state
      if (this.ui_params.bloom) {
        // When bloom is true, use the sphere as light source
        this.lights.push({
            position: sphereLightPosition,
            color: [1.0, 0.9, 0.8]
        });
      } else {
        // When bloom is false, use the original light source
        this.lights.push({
            position: originalLightPosition,
            color: [1.0, 1.0, 0.9]
        });
      }

      // Update sphere material
      const sphere = this.objects.find(obj => obj.mesh_reference === 'light_sphere');
      if (sphere) {
        if (this.ui_params.bloom) {
          sphere.material.properties.push('glow');
        } else {
          sphere.material.properties = sphere.material.properties.filter(prop => prop !== 'glow');
        }
      }
    };

    // Create UI elements
    create_slider('toon_levels', 'Toon Levels', 2, 10, this.ui_params.toon_levels, 
      (value) => { this.ui_params.toon_levels = value; });
    create_slider('toon_scale', 'Toon Scale', 0.1, 1.0, this.ui_params.toon_scale, 
      (value) => { this.ui_params.toon_scale = value; });
    create_slider('outline_threshold', 'Outline Threshold', 0.0, 1.0, this.ui_params.outline_threshold, 
      (value) => { this.ui_params.outline_threshold = value; });
    create_slider('depth_threshold', 'Depth Threshold', 0.0, 1.0, this.ui_params.depth_threshold, 
      (value) => { this.ui_params.depth_threshold = value; });

    // Add bloom toggle button
    create_button('Bloom Light Source', 
      () => { 
        this.ui_params.bloom = !this.ui_params.bloom; 
        console.log('Bloom is now:', this.ui_params.bloom);
        updateLightSource();
      });

    // Initialize light source
    updateLightSource();

    // Create sliders for toon shading parameters
    const n_steps_slider = 100;
    
    // Toon levels slider (2-10 levels)
    // Controls how many discrete color bands are used
    // Higher values = smoother transitions, lower values = more cartoon-like
    create_slider("Toon Levels", [2, 10], (i) => {
      this.ui_params.toon_levels = Number(i);
    });

    // Toon scale slider (0.5-2.0)
    // Controls the intensity of the shading
    // Lower values = more subtle shading, higher values = more dramatic
    create_slider("Toon Scale", [0, n_steps_slider], (i) => {
      this.ui_params.toon_scale = 0.5 + (i * 1.5 / n_steps_slider);
    });


    const sobel_steps = 25;
    create_slider("Sobel Threshold", [0, sobel_steps], (i) => {
      this.ui_params.depth_threshold = 0.01 + 0.5 * (i / sobel_steps);
    });

  }

}
