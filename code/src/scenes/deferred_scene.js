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

export class DeferredScene extends Scene {

  /**
   * A scene with dynamic lights to showcase deferred shading
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
    
    // Fixed light parameters
    this.lightParams = {
      count: 40,
      speed: 1.,
      height: 5.0,
      radius: 30.0
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

    // Dynamic lights
    this.dynamicLights = [];
    
    // Time tracking for light movement
    this.elapsedTime = 0;

    //initializations
    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene() {
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
    
    // Add ground/terrain - enlarged scale for more space
    this.objects.push({
      translation: [0, 0, 0.25],
      scale: [1.5, 1.5, 1.5], // Enlarged scale to accommodate more trees
      mesh_reference: 'terrain.obj',
      material: MATERIALS.terrain,
    });

    // Use generateTreePositions to create a forest with proper spacing
    const treeCount = 300; // Significantly more trees
    const maxOffset = 40; // Larger area for tree distribution
    const minTreeDistance = 2.5; // Increased minimum distance between trees
    
    // Generate positions for regular trees
    const treePositions = generateTreePositions(treeCount, maxOffset, minTreeDistance);
    
    // Add regular trees
    treePositions.forEach(tree => {
      // Randomly choose tree type
      const treeType = Math.random() > 0.7 ? 'TreeType2.obj' : 'TreeType1.obj';
      const treeMaterial = treeType === 'TreeType1.obj' ? MATERIALS.treeType1 : MATERIALS.treeType2;
      
      // Use a larger scale range for more variety
      const scale = 0.5 + Math.random() * 0.8;
      
      this.objects.push({
        translation: [tree.x, tree.y, tree.z],
        scale: [scale, scale, scale],
        mesh_reference: treeType,
        material: treeMaterial,
      });
    });

    // Add dead trees scattered throughout the scene
    const deadTreeCount = 30; // More dead trees
    const deadTreePositions = generateTreePositions(deadTreeCount, maxOffset * 0.8, minTreeDistance * 1.5);
    
    deadTreePositions.forEach(tree => {
      const deadTreeType = Math.random() > 0.5 ? 'DeadTreeType1.obj' : 'DeadTreeType2.obj';
      const scale = 1.0 + Math.random() * 1.5; // Larger scale for dead trees
      
      this.objects.push({
        translation: [tree.x, tree.y, tree.z],
        scale: [scale, scale, scale],
        mesh_reference: deadTreeType,
        material: MATERIALS.burntTree,
      });
    });



    // Initialize dynamic lights
    this.initializeDynamicLights();
  }

  /**
   * Initialize dynamic lights that will move around the scene
   */
  initializeDynamicLights() {
    // Clear existing dynamic lights
    this.dynamicLights = [];
    
    // Create new dynamic lights
    const lightCount = this.lightParams.count;
    const lightColors = [
      [1.0, 0.2, 0.2], // Red
      [0.2, 1.0, 0.2], // Green
      [0.2, 0.2, 1.0], // Blue
      [1.0, 1.0, 0.2], // Yellow
      [1.0, 0.2, 1.0], // Magenta
      [0.2, 1.0, 1.0]  // Cyan
    ];
    
    for (let i = 0; i < lightCount; i++) {
      // Calculate initial position on a circle
      const angle = (i / lightCount) * Math.PI * 2;
      
      // Use a larger radius to spread lights out more
      const radius = this.lightParams.radius;
      
      // Add some randomness to the radius to spread lights out more
      const randomizedRadius = radius * (0.7 + Math.random() * 0.4); // 80% to 120% of base radius
      
      const x = Math.cos(angle) * randomizedRadius;
      const y = Math.sin(angle) * randomizedRadius;
      const z = this.lightParams.height;
      
      // Create light with a color from our palette
      const light = {
        position: [x, y, z],
        color: lightColors[i % lightColors.length],
        radius: 30, // Increased light radius for better visibility
        // Store additional properties for animation
        initialAngle: angle,
        phaseOffset: Math.random() * Math.PI * 2, // Random phase offset for varied movement
        orbitRadius: randomizedRadius, // Store the orbit radius
      };
      
      this.dynamicLights.push(light);
      this.lights.push(light);
    }
  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {
    // Create a special actor for updating the dynamic lights
    this.actors["dynamic_lights"] = {
      evolve: (dt) => {
        this.updateDynamicLights(dt);
        this.checkAndUpdateStatusBox();
      }
    };
    
    // For other actors (like fire)
    for (const name in this.actors) {
      if (name !== "dynamic_lights") {
        const actor = this.actors[name];
        const originalEvolve = actor.evolve || ((dt) => {});
        
        actor.evolve = (dt) => {
          originalEvolve(dt);
          this.checkAndUpdateStatusBox();
        };
      }
    }
  }

  /**
   * Update the positions of dynamic lights
   * @param {number} dt - Delta time in seconds
   */
  updateDynamicLights(dt) {
    // Update elapsed time
    this.elapsedTime += dt * this.lightParams.speed;
    
    // Update each dynamic light position
    for (let i = 0; i < this.dynamicLights.length; i++) {
      const light = this.dynamicLights[i];
      
      // Calculate new position with some variation
      const angle = light.initialAngle + this.elapsedTime + light.phaseOffset;
      
      // Use the light's stored orbit radius
      const x = Math.cos(angle) * light.orbitRadius;
      const y = Math.sin(angle) * light.orbitRadius;
      
      // Add some vertical bobbing motion
      const z = this.lightParams.height + Math.sin(angle * 2) * 1.5;
      
      // Update light position
      light.position[0] = x;
      light.position[1] = y;
      light.position[2] = z;
    }
  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params() {
    // Create UI elements for common parameters
    // Toon levels slider (4-14 levels)
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

    // No additional sliders for light control - using fixed parameters

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
