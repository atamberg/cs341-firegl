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
import { FireSpreadAndBurn } from "../scene_resources/fire_spread.js";

export class MixedForestScene extends Scene {

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
  
    // Collection to store fire containers created by clicks
    this.fire_containers = [];
    this.fireIndex = 0;
    
    // Keep track of the original light for night mode
    this.originalLight = {
      position: [0.0, 10.0, 5.5],
      color: [1.0, 1.0, 1.0],
      radius: 200,
    };

    this.fireSpreadSystem = new FireSpreadAndBurn(this);

    //initiliaze cursor to keep track when spawning fire
    this.cursor = {x: 0, y: 0};

    //fire hint text message
    const hint = document.createElement('div');
    hint.id = 'fireHint';
    hint.textContent = 'Press F to start a fire';
    Object.assign(hint.style, {
      position: 'fixed',
      bottom: '20px',
      padding: '6px 12px',
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      fontSize: '25px',
    });
    document.body.appendChild(hint);

    //initializations
    this.initialize_scene();
    this.setup_click_handler();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene() {

    // TODO
    this.static

    // Store this as the original light for reference
    this.lights.push(this.originalLight);


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


    
    // Add ground - enlarged scale for more space
    this.objects.push({
      translation: [0, 0, 0.25],
      scale: [1.5, 1.5, 1.5], // Enlarged scale to accommodate more trees
      mesh_reference: 'terrain.obj',
      material: MATERIALS.terrain,
    });
    
    // Use improved tree generation with more variety and better spacing
    const treeCount = 300; // Significantly more trees
    const maxOffset = 40; // Larger area for tree distribution
    const minTreeDistance = 2.5; // Increased minimum distance between trees
    
    // Generate positions for trees
    const treePositions = generateTreePositions(treeCount, maxOffset, minTreeDistance);
    
    // Add trees with variety in type and scale
    treePositions.forEach(tree => {
      // Randomly choose tree type for more variety
      const treeType = Math.random() > 0.7 ? 'TreeType2.obj' : 'TreeType1.obj';
      const treeMaterial = treeType === 'TreeType1.obj' ? MATERIALS.treeType1 : MATERIALS.treeType2;
      
      // Use a larger scale range for more variety
      const scale = 0.5 + Math.random() * 0.8;
      
      this.objects.push({
        translation: [tree.x, tree.y, tree.z],
        scale: [scale, scale, scale],
        original_scale: [scale, scale, scale],
        burned_scale: [scale * 2.5, scale * 2.5, scale * 2.5],
        mesh_reference: treeType,
        material: treeMaterial,
      });
    });
  }
  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {
    // Define the evolve function for each actor
    for (const name in this.actors) {
      if (name.includes("fire")) {
        console.log(name);
        const fire = this.actors[name];
        fire.evolve = (dt) => {
          // Original fire spread functionality
          this.fireSpreadSystem.evolve(dt);
          
          // Check if UI parameters have changed and update status box if needed
          this.checkAndUpdateStatusBox();
        };
      } else {
        // For other actors
        const actor = this.actors[name];
        actor.evolve = (dt) => {
          // Check if UI parameters have changed and update status box if needed
          this.checkAndUpdateStatusBox();
        };
      }
    }
    
    // If there are no actors, create a dummy actor to ensure the status box updates
    if (Object.keys(this.actors).length === 0) {
      this.actors['_statusUpdater'] = {
        evolve: (dt) => {
          this.checkAndUpdateStatusBox();
        }
      };
    }
  }

  /**
   * Set up click handler to spawn fire where user clicks
   */
  setup_click_handler() {
    // Get the canvas element
    const canvas = document.getElementsByTagName('canvas')[0];

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.cursor.x = event.clientX - rect.left;
      this.cursor.y = event.clientY - rect.top;
    });
    
    console.log('Setting up click handler');
    
    // Add f key event listener
    window.addEventListener('keydown', (event) => {

      // Only handle middle clicks
      if (event.key !== 'f' && event.key !== 'F') return;
      
      console.log('Click detected! Event:', event.clientX, event.clientY);
      
      // Get click position in pixel coordinates
      const rect = canvas.getBoundingClientRect();
      const pixelX = this.cursor.x;
      const pixelY = this.cursor.y;
      
      // Calculate normalized device coordinates (NDC) from mouse position
      const ndcX = (pixelX / rect.width)*2 - 1;
      const ndcY = 1 - (pixelY / rect.height) * 2;  // Flip Y to match WebGL convention
      
      console.log('Canvas dimensions:', canvas.width, canvas.height);
      console.log('Pixel coords:', pixelX, pixelY);
      console.log('NDC coords:', ndcX, ndcY);
      
      // Calculate camera position in world space from view matrix
      // Extract the camera position from the view matrix
      const viewMatrix = this.camera.mat.view;
      const invViewMatrix = mat4.create();
      mat4.invert(invViewMatrix, viewMatrix);
      
      // Camera position is in the last column of the inverse view matrix
      const cameraPos = vec3.fromValues(
        invViewMatrix[12],
        invViewMatrix[13],
        invViewMatrix[14]
      );
      //console.log('Camera position:', cameraPos);
      
      // Create a 4D homogeneous point for the clicked NDC position
      const ndcNearPoint = vec3.fromValues(ndcX, ndcY, -1.0); // z=-1 for near plane
      const ndcFarPoint = vec3.fromValues(ndcX, ndcY, 1.0);  // z=1 for far plane
      
      //console.log('NDC points:', ndcNearPoint, ndcFarPoint);
      
      // Create inverse view-projection matrix
      const vpMatrix = mat4.create();
      mat4.multiply(vpMatrix, this.camera.mat.projection, this.camera.mat.view);
      
      const invVpMatrix = mat4.create();
      mat4.invert(invVpMatrix, vpMatrix);
      
      // Transform NDC points to world space
      const nearPointWorld = vec3.transformMat4(vec3.create(), ndcNearPoint, invVpMatrix);
      const farPointWorld = vec3.transformMat4(vec3.create(), ndcFarPoint, invVpMatrix);
      
      //console.log('Near point world:', nearPointWorld);
      //console.log('Far point world:', farPointWorld);
    
      const scene_z = 0.15;                                  
      const rayDirection = vec3.create();
      //console.log('Ray origin:', nearPointWorld);
      //console.log('Ray direction:', rayDirection);
      vec3.subtract(rayDirection, farPointWorld, nearPointWorld);
      vec3.normalize(rayDirection, rayDirection);
      //we only care about z coordinate, so lets solve t
      const t = (scene_z - nearPointWorld[2])/rayDirection[2];
  
      
      const hitPoint = vec3.create();
      vec3.scaleAndAdd(hitPoint, nearPointWorld, rayDirection, t);

      
      console.log('Spawning fire at:', hitPoint);
      this.spawnFireAtPosition(hitPoint);
      
    });
  }
  
  /**
   * Spawn a fire container at the specified position
   * @param {Array} position - [x, y, z] position to spawn the fire
   */
  spawnFireAtPosition(position) {
    // Create a new fire container
    const fireId = `fire_${this.fireIndex++}`;
    console.log(`Creating new fire with ID: ${fireId} at position:`, position);
    
    // Create fire container at exact same position as light
    const firePos = [...position];
    const fire = new FireAndSmoke(
      firePos, // Position - will be used as the center for particle effects
      [1.0, 1.0, 1.0], // Scale (smaller than the main fire)
      'billboard' // Use the same billboard mesh
    );
    
    const hint = document.getElementById('fireHint');
    if(hint){ 
      hint.style.display = 'none';
    }
  
    
    // Add to scene objects and actors
    this.objects.push(fire);
    this.actors[fireId] = fire;
    this.fire_containers.push(fire);
    this.lights.push(fire.light_source)
    // Add fire's light source with a slight offset for better lighting
    // const lightSource = {
    //   position: [position[0], position[1], position[2] + 0.3],
    //   color: [1.0, 0.7, 0.3], // Warm fire color
    // };
    // this.lights.push(lightSource);
    console.log("Light position: ", fire.light_source.position)
    console.log("Container position: ", fire.translation)
    console.log(`Fire created. Total fires: ${this.fire_containers.length}`);
    console.log('Current scene objects:', this.objects.length);
    console.log('Current scene actors:', Object.keys(this.actors).length);

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
