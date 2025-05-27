import * as MATERIALS from "../render/materials.js";

// Particle container superclass, inspired by https://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/particles-instancing/
export class ParticleContainer {
    constructor(translation, scale, mesh_reference) {
        this.translation = translation;
        this.scale = scale;
        this.mesh_reference = mesh_reference;
        this.material = MATERIALS.particle_green;
        this.color = this.material.color;
        this.particle_list = [];
        this.last_used_particle = 0;
        this.particle_count = 0;
        this.max_particles = 100000;
    }
    
    find_unused_particle() {
        for (let i = this.last_used_particle; i < this.max_particles; ++i) {
            if (this.particle_list[i].life <= 0) {
                this.last_used_particle = i;
                return i;
            }
        }

        for (let i = 0; i < this.last_used_particle; ++i) {
            if (this.particle_list[i].life <= 0) {
                this.last_used_particle = i;
                return i;
            }
        }
        this.last_used_particle = 0;
        return 0;
    }

    // To be overrided in subclass
    evolve(dt) { }
}
