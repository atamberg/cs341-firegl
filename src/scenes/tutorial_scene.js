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

    this.lights.push({
      position : [0.0 , -2.0, 2.5],
      color: [1.0, 1.0, 0.9]
    });

    this.objects.push({
      translation: [0,0,0],
      scale: [1,1,1],
      mesh_reference: 'pine.obj',
      material: MATERIALS.pine,
    })

    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", cg_mesh_make_uv_sphere(16));
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
    this.ui_params.toon_levels = 7;        // Number of discrete color bands (7 gives good balance)
    this.ui_params.toon_scale = 0.7;       // Scale factor (0.7 preserves color intensity well)
    this.ui_params.outline_threshold = 0.2; // Fixed outline threshold
    this.ui_params.outline_color = [0.0, 0.0, 0.0]; // Black outlines
    this.ui_params.show_shadows = false;    // Start with shadows off

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

    // Toggle button for shadows
    // Switches between bright mode (no shadows) and shadow mode
    create_button("Toggle Shadows", () => {
      this.ui_params.show_shadows = !this.ui_params.show_shadows;
    });
  }

}
