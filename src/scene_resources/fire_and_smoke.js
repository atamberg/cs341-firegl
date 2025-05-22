import { lerp } from "../../lib/gl-matrix_3.3.0/esm/vec3.js";
import { ParticleContainer } from "./particle_container.js";

export class FireAndSmoke extends ParticleContainer{
    constructor(translation, scale, mesh_reference){
        super(translation, scale, mesh_reference);
       
        this.max_particles = 6000;
        this.particles_per_frame = 45;     
        this.emission_radius = 0.35;
        this.fire_height = 2.0;            
        this.smoke_height = 4.0;          
        //not all particles become smoke 
        this.smoke_chance = 0.05;  
        //bright yellow - orange - red
        this.fire_colors = [[1.0, 0.9, 0.15], [1.0, 0.45, 0.0], [0.7, 0.05, 0.0]];
        
        //dark red - gray - black
        this.smoke_colors = [[0.7, 0.05, 0.0], [0.3, 0.3, 0.3], [0.0, 0.0, 0.0]];

        // Initialize light source
        this.light_source = {
            position: translation,
            color: this.fire_colors[0], // Use the base color of the fire
            radius: 5,
        };

        //initialize
        for(let i = 0; i < this.max_particles; ++i){
            this.particle_list.push({
                color: [0, 0, 0],
                life: -1,
                offset: [0, 0, 0],     
                velocity: [0, 0, 0],
                scale_multiplier: [0, 0, 0],
                becomes_smoke: false,
                smoke_lifetime: 0 
            });
        }
        this.particle_count = this.max_particles;

        
    }

    emitParticle(){
        const index = this.find_unused_particle();
        const particle = this.particle_list[index];
        
        //if particle becomes smoke
        particle.becomes_smoke = Math.random() < this.smoke_chance;

        //life of a smoke particle 
        particle.smoke_lifetime = 0.4 + Math.random() * 0.6;
        
        //spawn around/in the emission radius
        const random_angle = Math.random() * Math.PI * 2;

        particle.offset[0] = Math.cos(random_angle) * this.emission_radius * Math.random();
        particle.offset[1] = Math.sin(random_angle) * this.emission_radius * Math.random();
        particle.offset[2] = 0.0;  
        
        //random upward speed between [0.5, 1.0]
        const upward_speed = 0.5 + Math.random() * 0.5;  
                           
        //set velocity - random angle with a "depth" between [0.1, 0.3]
        particle.velocity[0] = Math.cos(random_angle) * (0.1 + Math.random() * 0.2) ;
        particle.velocity[1] = Math.sin(random_angle) * (0.1 + Math.random() * 0.2) ;
        particle.velocity[2] = upward_speed;
        
        //random scale between [0.03, 0.06]
        const scale = 0.03 + Math.random() * 0.03;
        particle.scale_multiplier[0] = scale;
        particle.scale_multiplier[1] = scale;
        particle.scale_multiplier[2] = scale;
        
        //initialize life
        particle.life = 1.0;
    }

    evolve(dt) {
        
        const slower_dt = dt * 0.6;
        
        //emit particles
        for(let i = 0; i < this.particles_per_frame; i++){
            this.emitParticle();
        }
        
        //update particles
        for(let i = 0; i < this.max_particles; i++){
            const particle = this.particle_list[i];
            
            //"remove" dead particles
            if(particle.life <= 0){
                particle.scale_multiplier[0] = 0;
                particle.scale_multiplier[1] = 0;
                particle.scale_multiplier[2] = 0;
                particle.offset[2] = 100; 
                particle.life = -1;
                continue;
            }
            
            //check if particle becomes smoke
            const isSmoke = particle.becomes_smoke && (particle.offset[2] > this.fire_height);
            
            //handle smoke particles life
            if(isSmoke){
                particle.smoke_lifetime -= slower_dt;
                if(particle.smoke_lifetime <= 0){
                    particle.offset[2] = 100;
                    particle.life = -1;
                    continue;
                }
            }
            
            //kill particle if reached max height
            const randHeight = 0.8 + Math.random() * 0.4;
            const maxHeight = particle.becomes_smoke ? this.smoke_height : this.fire_height ;
            if(particle.offset[2] >= randHeight * maxHeight){
                particle.offset[2] = 100;
                particle.life = -1;
                continue;
            }
            
            //update position
            particle.offset[0] += particle.velocity[0] * slower_dt;
            particle.offset[1] += particle.velocity[1] * slower_dt;
            particle.offset[2] += particle.velocity[2] * slower_dt;
            
            //simple zigzag motion
            if(!isSmoke){
                const random_angle = Math.random() * Math.PI * 2
                particle.velocity[0] += Math.cos(random_angle) * 0.025;  
                particle.velocity[1] += Math.sin(random_angle) * 0.025; 
            }else{
                particle.velocity[2] *= 0.985;
            }
            
            //buoyancy effect
            if(!isSmoke){
                //get the height ratio [0,1]
                const heightRatio = particle.offset[2] / this.fire_height;
                //upward acceleration (stronger when lower)
                particle.velocity[2] += (1.0 - heightRatio) * 4.0 * slower_dt; 
            }
            
            //update colors
            this.updateColors(particle, isSmoke);
        }
    }
    
    updateColors(particle, isSmoke){
        //using linear interpolation, based on height
        if(isSmoke){
            const heightRatio = particle.offset[2] / this.smoke_height;
            if (heightRatio < 0.3) {
                //bottom gray
                const t = heightRatio / 0.3;
                lerp(particle.color, this.smoke_colors[0], this.smoke_colors[1], t);
            } else  {
                //gray to black
                const t = (heightRatio - 0.3) / 0.7;
                lerp(particle.color, this.smoke_colors[1], this.smoke_colors[2], t);
            } 
        }else{
            //color fire based on particle height
            const heightRatio = particle.offset[2] / this.fire_height;
            if(heightRatio < 0.4){
                //bottom yellow
                const t = heightRatio / 0.4;
                lerp(particle.color, this.fire_colors[0], this.fire_colors[1], t);
            }else{
                //orange to red
                const t = (heightRatio - 0.4) / 0.6;
                lerp(particle.color, this.fire_colors[1], this.fire_colors[2], t);
             
            }
        }
    }
}
