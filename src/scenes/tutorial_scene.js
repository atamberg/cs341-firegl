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

export class TutorialScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;
    this.ui_params = {
      bloom: false,
      bloom_intensity: 1.0,
      blur_radius: 1.0,
      toon_shading: false,
      toon_levels: 4,
      toon_scale: 1.0,
      outline_threshold: 0.5,
      outline_width: 0.5,
      outline_smoothness: 0.5
    };

    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene(){

    // Position constants
    const originalLightPosition = [0.0, -2.0, 2.5];
    const sphereLightPosition = [1.5, 1.5, 2];
    
    // Add initial light source
    this.lights.push({
        position: this.ui_params.bloom ? sphereLightPosition : originalLightPosition,
        color: [1.0, 1.0, 1.0],
        intensity: this.ui_params.bloom ? 1.5 : 1.0
    });

    // Create the light source material clone for bloom
    this.lightSourceMaterial = Object.assign({}, MATERIALS.light_source);
    
    // Make a copy of the light source material properties
    this.lightSourceMaterial.properties = [...MATERIALS.light_source.properties];
    
    // Add the bloom property if bloom is enabled
    if (this.ui_params.bloom) {
        if (!this.lightSourceMaterial.properties.includes('bloom')) {
            this.lightSourceMaterial.properties.push('bloom');
        }
    }

    // Add resources
    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", cg_mesh_make_uv_sphere(16));
    this.resource_manager.add_procedural_mesh("light_sphere", cg_mesh_make_uv_sphere(32));
    this.resource_manager.add_procedural_mesh("billboard", cg_mesh_make_plane());
    this.resource_manager.add_procedural_mesh("ground", cg_mesh_make_plane());

    // Add environment sphere
    this.objects.push({
      translation: [0, 0, 0],
      scale: [80., 80., 80.],
      mesh_reference: 'mesh_sphere_env_map',
      material: MATERIALS.sunset_sky
    });

    // Add pine tree
    this.objects.push({
      translation: [0, 0, 0],
      scale: [1, 1, 1],
      mesh_reference: 'pine.obj',
      material: MATERIALS.pine,
    });

    // Add billboard
    this.objects.push({
      translation: [0, 0, 2],
      scale: [0.5, 0.5, 0.5],
      mesh_reference: 'billboard',
      material: MATERIALS.billboard,
    });

    // Add light source sphere
    this.objects.push({
      translation: sphereLightPosition,
      scale: [0.2, 0.2, 0.2],
      mesh_reference: 'light_sphere',
      material: this.lightSourceMaterial  // Use our custom material
    });
    
    // Store the light source object index for easy reference
    this.lightSourceIndex = this.objects.length - 1;

    // Add ground
    this.objects.push({
      translation: [0, 0, 0],
      scale: [1, 1, 1],
      mesh_reference: 'ground',
      material: MATERIALS.gray,
    });

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
      // Position constants
      const originalLightPosition = [0.0, -2.0, 2.5];
      const sphereLightPosition = [1.5, 1.5, 2];
      
      // Clear existing lights
      this.lights = [];

      // Add new light source based on bloom state
      this.lights.push({
          position: this.ui_params.bloom ? sphereLightPosition : originalLightPosition,
          color: [1.0, 1.0, 1.0],
          intensity: this.ui_params.bloom ? 1.5 : 1.0
      });
      
      // Update the light source material for bloom effect
      if (this.ui_params.bloom) {
          // Add the bloom property if it doesn't exist
          if (!this.lightSourceMaterial.properties.includes('bloom')) {
              this.lightSourceMaterial.properties.push('bloom');
          }
          
          // Increase intensity for better bloom effect
          this.lightSourceMaterial.intensity = 1.5;
          this.lightSourceMaterial.color = [1.0, 0.95, 0.8]; // Warmer color for bloom
      } else {
          // Remove the bloom property
          const bloomIndex = this.lightSourceMaterial.properties.indexOf('bloom');
          if (bloomIndex !== -1) {
              this.lightSourceMaterial.properties.splice(bloomIndex, 1);
          }
          
          // Reset intensity to normal
          this.lightSourceMaterial.intensity = 1.0;
          this.lightSourceMaterial.color = [1.0, 0.95, 0.9];
      }
      
      // Update the light source object if it exists
      if (this.lightSourceIndex !== undefined && 
          this.objects[this.lightSourceIndex]) {
          this.objects[this.lightSourceIndex].material = this.lightSourceMaterial;
      }
    };

    // Create UI elements
    create_slider('Toon Levels', [2, 10], (value) => { this.ui_params.toon_levels = Number(value); });
    create_slider('Toon Scale', [0.1, 1.0], (value) => { this.ui_params.toon_scale = Number(value); });
    create_slider('Outline Threshold', [0.0, 1.0], (value) => { this.ui_params.outline_threshold = Number(value); });
    create_slider('Outline Width', [0.0, 2.0], (value) => { this.ui_params.outline_width = Number(value); });
    create_slider('Outline Smoothness', [0.0, 1.0], (value) => { this.ui_params.outline_smoothness = Number(value); });
    create_slider('Bloom Intensity', [0.0, 2.0], (value) => { this.ui_params.bloom_intensity = Number(value); });
    create_slider('Blur Radius', [0.0, 5.0], (value) => { this.ui_params.blur_radius = Number(value); });

    // Create buttons
    create_button('Bloom Effect', 
      () => { 
        this.ui_params.bloom = !this.ui_params.bloom;
        updateLightSource();
        console.log('Bloom effect ' + (this.ui_params.bloom ? 'enabled' : 'disabled'));
      });
    create_button('Toon Shading', 
      () => { this.ui_params.toon_shading = !this.ui_params.toon_shading; });

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
