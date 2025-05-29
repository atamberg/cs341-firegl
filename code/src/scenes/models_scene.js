import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere, cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"
import { vec3, mat4 } from "../../lib/gl-matrix_3.3.0/esm/index.js"

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
import { Material } from "../../lib/webgl-obj-loader_2.0.8/webgl-obj-loader.module.js";


export class ModelsScene extends Scene {

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
      depth_threshold: 0.1,
      exposure: 1.0,
      toon_shading: false,
      toon_levels: 4,
      toon_scale: 1.0,
      outline_color: [0.0, 0.0, 0.0],
      outline_threshold: 0.5,
      outline_width: 0.5,
      outline_smoothness: 0.5,
      night_mode: false,
      deferred_shading: true,
      deferred_shading_buffer: 0,
    };
    
    // Create status box for boolean parameters
    this.statusBox = document.createElement('div');
    this.statusBox.id = 'boolParamsStatus';
    Object.assign(this.statusBox.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      fontSize: '14px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      zIndex: '1000',
      maxWidth: '200px',
    });
    document.body.appendChild(this.statusBox);
    
    // For tracking parameter changes
    this.lastParamState = JSON.stringify(this.getParamState());
    this.updateStatusBox(); // Initialize status box
  

    
    // Keep track of the original light for night mode
    this.originalLight = {
      position: [0.5, 10, 5.5],
      color: [1.0, 1.0, 1.0],
      radius: 50,
    };


    //initializations
    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene() {

    // TODO
    this.static

    // Store this as the original light for reference
    // this.lights.push(this.originalLight);


    // Add resources
    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", cg_mesh_make_uv_sphere(16));
    this.sky = {
      translation: [0, 0, 0],
      scale: [80., 80., 80.],
      mesh_reference: 'mesh_sphere_env_map',
      material: MATERIALS.sunset_sky,
    }
    this.objects.push(this.sky);

    this.resource_manager.add_procedural_mesh("billboard", cg_mesh_make_plane());




    
    // Add ground
    this.objects.push({
      translation: [0, 0, 0],
      scale: [0.3, 1., 0.3],
      mesh_reference: 'terrain.obj',
      material: MATERIALS.terrain,
    });

    
    this.objects.push({
      translation: [0,-0,0.1],
      scale: [1.0,1.0,1.0],
      mesh_reference: 'TreeType1.obj',
      material: MATERIALS.treeType1,
    });
    
    this.objects.push({
      translation: [0, 5,0.1],
      scale: [2.0,2.0,2.0],
      mesh_reference: 'DeadTreeType1.obj',
      material: MATERIALS.burntTree,
    });
    
    this.objects.push({
      translation: [0, -5,0.1],
      scale: [2.0,2.0,2.0],
      mesh_reference: 'DeadTreeType2.obj',
      material: MATERIALS.burntTree,
    });
    this.objects.push();
    // Add fire and smoke effect
    const fireAndSmoke = new FireAndSmoke([0, 10, 0.1], [3, 3, 3], 'billboard');
    this.objects.push(fireAndSmoke);
    this.actors["fire"] = fireAndSmoke;


    this.objects.push({
      translation: [0, -10,0.1],
      scale: [1.0,1.0,1.0],
      mesh_reference: 'TreeType2.obj',
      material: MATERIALS.treeType2,
    });

    // Add rainbow vomit particles
    const rainbowVomit = new RainbowVomitParticles([-0, 20, 0.1], [.1, .1, .1], 'billboard');
    this.objects.push(rainbowVomit);
    this.actors["rainbow"] = rainbowVomit;

    this.objects.push({
      translation: [0, -20, 3],
      scale: [1, 1, 1],
      mesh_reference: 'billboard',
      material: MATERIALS.billboard,
      particle_list: [{
        color: MATERIALS.billboard.color,
        life: -1,
        offset: [0,0,0],
        scale_multiplier: [4, 1],
      }],
      particle_count: 1,
    });

    this.lights.push({
      position: [-10, -20, 5.5],
      color: [1.0, 1.0, 1.0],
      radius: 50,
    });
    this.lights.push({
      position: [
        -10, 20, 5.5],
      color: [1.0, 1.0, 1.0],
      radius: 50,
    });
    this.lights.push({
      position: [
        -10, 0, 5.5],
      color: [1.0, 1.0, 1.0],
      radius: 50,
    });
  }
  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {
    // Add status updater actor to ensure the status box updates every frame
    this.actors['_statusUpdater'] = {
      evolve: (dt) => {
        this.checkAndUpdateStatusBox();
      }
    };
  }
  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params() {
    
    // Create UI elements
    // Note: According to cg_web.js, create_slider expects (title, range, action) format
    //keep track of initial params
    // Toon levels slider (4-14 levels)
    // Controls how many discrete color bands are used
    // Higher values = smoother transitions, lower values = more cartoon-like
    create_slider("Toon Levels", [0, 10], (i) => {
      this.ui_params.toon_levels = 4 + Number(i);
    });

    const sobel_steps = 25;
    create_slider("Sobel Threshold", [0, sobel_steps], (i) => {
      this.ui_params.depth_threshold = 0.01 + 0.5 * (i / sobel_steps);
    });

        // Bloom threshold slider
    create_slider("Bloom Threshold", [0, 100], (value) => {
      this.ui_params.bloom_threshold = Number(value)/100;
     
    });
    
    // Bloom intensity slider
    create_slider("Bloom Intensity", [1, 10], (value) => {
      this.ui_params.bloom_intensity = Number(value);
      
    });
    
    
    // Exposure slider for HDR tone mapping
    create_slider("Bloom Exposure", [0, 3], (value) => {
      this.ui_params.exposure = Number(value);
      
    });

    // Create a toggle button for night mode
    create_button("Night Mode", () => {
      const isNightMode = this.ui_params.night_mode;
      this.ui_params.night_mode = !isNightMode;

      // Toggle light sources
      if (this.ui_params.night_mode) {
        // Remove the original light source
        const lightIndex = this.lights.indexOf(this.originalLight);
        if(lightIndex !== -1){
          this.lights.splice(lightIndex, 1);
        }
        this.sky.overlay = [0.1, 0.1, 0.1];
      } else {
        // Add the original light source
        if(!this.lights.includes(this.originalLight)){
          this.lights.push(this.originalLight);
        }
        this.sky.overlay = [1, 1, 1];
      }
      this.updateStatusBox();
    });
    


    // Store the original light source
    this.originalLight = this.lights[0];
  
  // Update status box with current boolean parameter values
  this.updateStatusBox();
}

/**
 * Gets the current state of boolean parameters for comparison
 */
getParamState() {
  return {
    bloom: this.ui_params.bloom,
    toon_shading: this.ui_params.toon_shading,
    night_mode: this.ui_params.night_mode,
    deferred_shading: this.ui_params.deferred_shading
  };
}

/**
 * Updates the status box with current boolean parameter values
 */
updateStatusBox() {
  if (!this.statusBox) return;
  
  const boolParams = {
    'Bloom': this.ui_params.bloom,
    'Toon Shading': this.ui_params.toon_shading,
    'Night Mode': this.ui_params.night_mode,
    'Deferred Shading': this.ui_params.deferred_shading
  };
  
  let html = '<strong>Parameters:</strong><br>';
  
  for (const [param, value] of Object.entries(boolParams)) {
    const status = value ? 'ON' : 'OFF';
    const color = value ? '#4CAF50' : '#F44336';
    html += `<div style="margin: 5px 0">
      <span>${param}:</span>
      <span style="color: ${color}; font-weight: bold">${status}</span>
    </div>`;
  }
  
  this.statusBox.innerHTML = html;
}

/**
 * Check if parameters have changed and update status box if needed
 * This is called every frame to ensure the status box is always up to date
 */
checkAndUpdateStatusBox() {
  const currentState = JSON.stringify(this.getParamState());
  if (currentState !== this.lastParamState) {
    this.updateStatusBox();
    this.lastParamState = currentState;
  }
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
    //random scale between [0.5, 0.7]
    const scale = 0.4 + Math.random() * 0.1;
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
