
import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere, cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action 
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

    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene(){

    // TODO
    this.static

    this.ambient_factor = 0.5;

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
    })

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

    // TODO

  }

}
