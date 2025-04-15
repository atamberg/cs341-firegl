---
title: Project Proposal CS-341 2025
---

# Fire Simulation

![A forest burning](images/ForestFire.jpg){width="600px"}

## Abstract

This project simulates the behavior of fire spreading through a scene (e.g. a forest). We'd like that a user’s click could start (spawn) a fire, and that with time it'll spread throughout the scene. This fire would produce light, smoke particles, and a bloom effect when looking at it. The user should have the option to enable toon shaders should complement the scene's simple polygon esthetic, juxtaposed with the semi-realistic fire.

We'll need to a make a relatively robust particle system. We anticipate that deferred shading will improve performance in scenes with many light-producing fire nodes. As for technical challenges, we expect to face them while implementing fire/smoke spread. Synthesizing the 'hard' features into a complete scene versus just being separate demos may too be difficult. Realistic smoke/fire collisions that one might find in closed spaces may be out of scope for this project. 

Even in graphically simple games, using advanced particle and lighting systems can create a surprisingly 'realistic' visual experience--often more so than high-resolution textures. Lighting, shadows, and effects like fog, bloom, and reflections contribute far more to a scene’s atmosphere than surface-level detail. Our perception of realism is shaped more by how light interacts with the environment than by how detailed individual textures appear. This principle is a big part of why we chose a fire simulation. Fire is dynamic and relies on animated lighting, color shifts, and particle behavior, making it a perfect showcase for how visual effects can create realism without complex models or textures.

![Fire effect from the game *Teardown*](images/teardown-fire1.jpg){width="600px"}

## Features

| Feature          							| Points | Adapted Points |
|-------------------------------------------|--------|----------------|
| Mesh and Scene Design	    				| 5      | 5              |
| Bloom										| 5      | 5              |
| Toon Shaders								| 10     | 10             |
| Deferred Shading							| 20     | 15             |
| Particle Effects							| 20     | 15             |

![Fire spread with thick smoke!](images/teardown-fire2.jpg){width="600px"}

## Schedule


<table>
	<tr>
		<th style="width: 20%"></th>
		<th>Leopold Popper</th>
		<th>Ali Gorgani</th>
		<th>Anthony Tamberg</th>
	</tr>
	<tr>
		<td>Week 1</td>
		<td>Brainstorm</td>
		<td>Brainstorm</td>
		<td>Brainstorm</td>
	</tr>
	<tr style="background-color: #f9f9f9;">
		<td colspan="4" align="center">Proposal</td>
	</tr>
	<tr>
		<td>Week 2 (Easter)</td>
		<td>Work on meshes</td>
		<td></td>
		<td>Research procedural fire generation</td>
	</tr>
	<tr>
		<td>Week 3</td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr>
		<td>Week 4</td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="background-color: #f9f9f9;">
		<td colspan="4" align="center">Milestone</td>
	</tr>
	<tr>
		<td>Week 5</td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr>
		<td>Week 6</td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr>
		<td>Week 7</td>
		<td></td>
		<td></td>
		<td></td>
	</tr>
	<tr style="background-color: #f9f9f9;">
		<td colspan="4" align="center">Video and Report</td>
	</tr>
</table>


## Resources

- **Fog:** [3D Game Shaders for Beginners - Fog](https://lettier.github.io/3d-game-shaders-for-beginners/fog.html)
- **Bloom:** [Learn OpenGL Bloom](https://learnopengl.com/Advanced-Lighting/Bloom)
- **Bloom on ShaderToy:** [Bloom](https://www.shadertoy.com/results?query=bloom)
- **Blender Meshes:** [Primitives](https://docs.blender.org/manual/en/latest/modeling/meshes/primitives.html)
- **Noise Functions:** [Seph Gentle’s Implementations](https://github.com/josephg/noisejs)
- **Worley Noise:** [The Book of Shaders](https://thebookofshaders.com/12/)
- **Particle Effects:** [Polygon Shredder](https://github.com/spite/polygon-shredder)
