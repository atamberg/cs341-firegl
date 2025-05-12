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
import { FireAndSmoke } from "../scene_resources/fire_and_smoke.js";

export class TutorialScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager) {
    super();

    this.resource_manager = resource_manager;
    this.ui_params = {
      bloom: false,
      bloom_threshold: 0.8,
      bloom_intensity: 1.0,
      blur_radius: 1.0,
      exposure: 1.0,
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
  initialize_scene() {

    // TODO
    this.static

    this.lights.push({
      position: [0.0, 0, 5.5],
      color: [0.0, 1.0, 0.9]
    });


    // Add resources
    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", cg_mesh_make_uv_sphere(16));
    this.objects.push({
      translation: [0, 0, 0],
      scale: [80., 80., 80.],
      mesh_reference: 'mesh_sphere_env_map',
      material: MATERIALS.sunset_sky
    });

    this.resource_manager.add_procedural_mesh("billboard", cg_mesh_make_plane());


    
    // Add ground
    this.objects.push({
      translation: [0, 0, 0.25],
      scale: [0.3, 0.3, 0.3],
      mesh_reference: 'terrain.obj',
      material: MATERIALS.terrain,
    });

    const fire = new FireAndSmoke([0, 0, 0.1], [1.5, 1.5, 1.5], 'billboard');
    this.objects.push(fire);
    this.actors["fire"] = fire;
    /*
    //generate positions, can tweak values
    const treePositions = generateTreePositions(400, 8, 0.4);

    //add trees
    treePositions.forEach(tree => {
      this.objects.push({
        translation: [tree.x, tree.y, tree.z],
        scale: [tree.scale, tree.scale, tree.scale],
        mesh_reference: 'pine.obj',
        material: MATERIALS.pine
      });
    });*/
  

    

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {

    // TODO

  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params() {
    // Initialize toon shading parameters with optimal defaults
    this.ui_params.toon_levels = 4;        // Number of discrete color bands (7 gives good balance)
    this.ui_params.toon_scale = 0.7;       // Scale factor (0.7 preserves color intensity well)
    this.ui_params.outline_threshold = 0.2; // Fixed outline threshold
    this.ui_params.outline_color = [0.0, 0.0, 0.0]; // Black outlines
    this.ui_params.depth_threshold = 0.1;

    this.ui_params.bloom = false;


    // Create UI elements
    // Note: According to cg_web.js, create_slider expects (title, range, action) format
  
    
    // Bloom threshold slider
    create_slider("Bloom Threshold", [0, 1], (value) => {
      this.ui_params.bloom_threshold = Number(value);
    });
    
    // Bloom intensity slider
    create_slider("Bloom Intensity", [0, 2], (value) => {
      this.ui_params.bloom_intensity = Number(value);
    });
    
    // Blur radius slider
    create_slider("Blur Radius", [0, 3], (value) => {
      this.ui_params.blur_radius = Number(value);
    });
    
    // Exposure slider for HDR tone mapping
    create_slider("Exposure", [0, 3], (value) => {
      this.ui_params.exposure = Number(value);
    });
    
    // Toon shading toggle
    create_slider("Toon Shading", [0, 1], (value) => {
      this.ui_params.toon_shading = Number(value) > 0.5;
    });
    
    // Toon levels slider
    create_slider("Toon Levels", [1, 8], (value) => {
      this.ui_params.toon_levels = Number(value);
    });
    
    // Toon scale slider
    create_slider("Toon Scale", [0, 2], (value) => {
      this.ui_params.toon_scale = Number(value);
    });
    
    // Outline toggle
    create_slider("Outline", [0, 1], (value) => {
      this.ui_params.outline_threshold = Number(value) > 0.5;
    });
    
    // Outline width slider
    create_slider("Outline Width", [0, 1], (value) => {
      this.ui_params.outline_width = Number(value);
    });
    
    // Outline smoothness slider
    create_slider("Outline Smoothness", [0, 1], (value) => {
      this.ui_params.outline_smoothness = Number(value);
    });

    // Create buttons
    create_button('Bloom Effect', 
      () => { this.ui_params.bloom = !this.ui_params.bloom;});
    create_button('Toon Shading', 
      () => { this.ui_params.toon_shading = !this.ui_params.toon_shading; });



    console.log('Initial lights:', this.lights);
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
/**
 * Generate positions for trees.
 * @param {*} count 
 * @param {*} maxOffset 
 * @param {*} minTreeDistance 
 * @returns list of positions.
 */
function generateTreePositions(count, maxOffset, minTreeDistance) {
  const positions = [];
  //in case of overlaps
  let attempts = 0;
  const maxAttempts = count * 10;

  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    //random positions between [-maxOffset, maxOffset]
    const x = (Math.random() * 2 - 1) * maxOffset;
    const y = (Math.random() * 2 - 1) * maxOffset;
    //random scale between [0.5, 1.2]
    const scale = 0.5 + Math.random() * 0.7;
    //check overlaps
    let overlaps = false;
    for (const pos of positions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      //overlap check
      if (distance < minTreeDistance) {
        overlaps = true;
        break;
      }
    }
    //if no overlaps add position
    if (!overlaps) {
      positions.push({ x, y, z: 0, scale });
    }
  }
  return positions;
}
