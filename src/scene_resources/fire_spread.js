import { dist } from "../../lib/gl-matrix_3.3.0/esm/vec3.js";
import { FireAndSmoke } from "../scene_resources/fire_and_smoke.js";
import * as MATERIALS from "../render/materials.js"

export class FireSpreadAndBurn{
    constructor(scene){
        this.scene = scene;
        //set of all burned trees
        this.burnedTrees = new Set();
        //map of burning trees and the fire object burning the tree
        this.burningTrees = new Map();
        this.burnCheckInterval = 5.0;
        this.burnCheckTimer = 0;
        //tree can ignite being close to a fire
        this.burnRadius = 1.5;
        this.burnDuration = 3.0;
        //keep track of trees burning
        this.burnTimers = new Map();

        //handle the spread of a fire (excluding fires burning a tree)
        this.fireSpreadRate = 0.05;
        this.fireSpreadInterval = 5.0;
        this.fireSpreadTimer = 0;
        //setting a limit to how much a fire can spread
        this.maxFireSpread = 5.0;
    }

    evolve(dt){

        this.burnCheckTimer += dt;
        this.fireSpreadTimer += dt;
        //spread fire
        if(this.fireSpreadTimer >= this.fireSpreadInterval){

            this.scene.fire_containers.forEach(fire => {
                fire.emission_radius += 0.3;

                if(fire.emission_radius > this.maxFireSpread){
                    fire.emission_radius = this.maxFireSpread;
                } else {
                    fire.particles_per_frame *= 1.2; 
                }
            });

            this.fireSpreadTimer = 0;
        }
    
        //burn trees "touched" by fire
        if(this.burnCheckTimer >= this.burnCheckInterval){
            const fires = [...this.scene.fire_containers, ...this.burningTrees.values()];
            
            fires.forEach(fire => {
                
                const firePosition = fire.translation;
                const burnZone = fire.emission_radius * this.burnRadius;
                
                this.scene.objects.forEach(obj => {
                    //skip objects that are not trees, or if tree already burnt, or if tree already burning
                    if(obj.mesh_reference !== 'TreeType1.obj' || this.burnedTrees.has(obj) || this.burningTrees.has(obj)){
                        return;
                    }

            
                    const distance = dist(firePosition, obj.translation);

                    if(distance <= burnZone){
                        console.log("burning tree!");
                    
                        this.createTreeFire(obj);
                    }
                });
            });

            this.burnCheckTimer = 0;
        }


        //we dont want trees burning forever
        this.updateBurningTrees(dt);

    }

    //create fire over tree
    createTreeFire(tree){

        const treePos = tree.translation;
        console.log("Tree position:", treePos);
        const treeScale = tree.scale[0];
        

        const treeFire = new FireAndSmoke(
            treePos, 
            [1.0, 1.0, 1.0], 
            'billboard'
        );

        console.log("Fire position:", treeFire.translation);

        

        const fireId = `fire_${this.scene.fireIndex++}`;
        
        this.scene.objects.push(treeFire);
        this.scene.actors[fireId] = treeFire;

        this.scene.lights.push(treeFire.light_source);
        //keep track of burning trees
        this.burningTrees.set(tree, treeFire);
        this.burnTimers.set(tree, 0);
    }

    updateBurningTrees(dt){
        for(const [tree, fire] of this.burningTrees.entries()){
            let time = this.burnTimers.get(tree) + dt;
            this.burnTimers.set(tree, time);

            if(time >= this.burnDuration){

                tree.material = MATERIALS.burntTree;
                tree.mesh_reference = 'DeadTreeType1.obj';
                tree.scale = [tree.scale[0]*1.5, tree.scale[0]*1.5,tree.scale[0]*1.5];
            

                //remove tracking of tree burning
                this.burningTrees.delete(tree);
                this.burnTimers.delete(tree);
                
                //add it to burned trees
                this.burnedTrees.add(tree);
                
                //remove fire
                const fireIndex = this.scene.objects.indexOf(fire);
                this.scene.objects.splice(fireIndex, 1);

                //remove its light source
                const lightIndex = this.scene.lights.indexOf(fire.light_source);
                if (lightIndex != 1){
                    this.scene.lights.splice(lightIndex, 1);
                }

               
                const fireId = Object.keys(this.scene.actors).find(key => this.scene.actors[key] === fire);
                delete this.scene.actors[fireId];
            }
        }
    }
}