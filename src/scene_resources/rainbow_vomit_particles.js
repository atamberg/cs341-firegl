import { vec2, vec3, vec4, mat3, mat4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js"
import { scaleAndAdd, fromValues, random } from "../../lib/gl-matrix_3.3.0/esm/vec3.js";
import { ParticleContainer } from "./particle_container.js";

export class RainbowVomitParticles extends ParticleContainer {

    constructor(translation, scale, mesh_reference) {
        super(translation, scale, mesh_reference);
        for (let i = 0; i < this.max_particles; ++i) {
            this.particle_list.push({
                color: [0, 0, 0],
                life: -1,
                offset: [0, 0, 0],
                scale_multiplier: [1, 1, 1],
            });
            this.particle_count++;
        }
    }

    evolve(dt) {
        for (let i = 0; i < 100; ++i) {
            const j = this.find_unused_particle()
            this.particle_list[j] = {
                color: random(vec3.create()),
                life: 20,
                speed: fromValues(3 * Math.cos(i), 5 * Math.sin(i), 25),
                offset: [Math.cos(i), Math.sin(i), 0],
                scale_multiplier: [1, 1, 1],
            };
        }

        for (let i = 0; i < this.max_particles; ++i) {
            let p = this.particle_list[i]
            if (p.life > 0) {
                p.life -= dt;
                let next_speed = fromValues(0, 0, -9.81);
                scaleAndAdd(p.speed, p.speed, next_speed, dt * 0.5);
                scaleAndAdd(p.offset, p.offset, p.speed, dt);
            }
        }
    };
}
