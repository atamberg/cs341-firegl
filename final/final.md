---
title: Final Project Report CS-341 2025
---

# FireGL - Fire Simulation in WebGL

<div style="display:flex; justify-content: space-around; align-items: center;">
<div>
<video src="videos/minifire.webm" height="400px" autoplay loop style="vertical-align: middle;"></video>
</div>
</div>
<figcaption style="text-align: center;">Close-up fire with cycling toon and bloom post-processing effects</figcaption>

## Abstract

TODO


## Overview

![Our final video showing off most major features](videos/video-group64.mp4){width="700px"}

TODO


## Feature validation

<table>
	<caption>Feature Summary</caption>
	<thead>
		<tr>
			<th>Feature</th>
			<th>Adapted Points</th>
			<th>Status</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Mesh and Scene Design</td>
			<td>5</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Bloom</td>
			<td>5</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Toon Shaders</td>
			<td>10</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Deferred Shading</td>
			<td>15</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Particle Effects</td>
			<td>15</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
	</tbody>
</table>


### Mesh 

#### Implementation

##### Scene Design

We created several scenes to test our features. Each scene uses a component-based design that separates rendering, behavior, and user interaction.

**Dynamic Lighting System**

In [deferred_scene.js](../src/scenes/deferred_scene.js), we added dynamic lights that move in orbital patterns:

- **Parametric Animation**: Each light follows orbital paths defined by parametric equations:
  ```javascript
  light.position[0] = Math.cos(angle) * radius;
  light.position[1] = Math.sin(angle) * radius;
  light.position[2] = height + Math.sin(angle * 2) * amplitude;
  ```

- **Phase Offsets**: Each light starts at a different position in its orbit to avoid synchronized movement:
  ```javascript
  const phase = i * (Math.PI * 2) / lightCount;
  angle = (t * speed) + phase;
  ```

- **Random Variations**: Lights have different orbit sizes, heights, and speeds to make the scene more interesting:
  ```javascript
  const radius = baseRadius + (Math.random() * 2 - 1) * radiusVariation;
  ```

**Procedural Object Placement**

Our `generateTreePositions()` function (in [mixed_forest_scene.js](../src/scenes/mixed_forest_scene.js) and [models_scene.js](../src/scenes/models_scene.js)) places trees randomly while avoiding overlaps:

- **Collision Avoidance**: We check distances between trees to prevent them from overlapping:
  ```javascript
  const tooClose = positions.some(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return (dx * dx + dy * dy) < (minDistance * minDistance);
  });
  ```

- **Random Properties**: Trees get different scales and types for more variety:
  ```javascript
  const scale = 0.5 + Math.random() * 0.8;
  const treeType = Math.random() > 0.7 ? 'TreeType2.obj' : 'TreeType1.obj';
  ```

- **Spatial Optimization**: We use a grid-based approach to reduce the computational complexity of collision checks from O(n²) to O(n log n), allowing us to place hundreds of objects efficiently.

**Fire Spread System**

The mixed forest scene [mixed_forest_scene.js](../src/scenes/mixed_forest_scene.js) includes a fire system ([fire_spread.js](../src/scene_resources/fire_spread.js)) that shows off our particles and lighting:

- **Object State Management**: Each tree stores multiple states (normal, burning, burned) with associated properties:
  ```javascript
  original_scale: [scale, scale, scale],
  burned_scale: [scale * 2.5, scale * 2.5, scale * 2.5],
  ```

- **Proximity-Based Propagation**: Fire spreads naturally between nearby objects based on configurable parameters:
  ```javascript
  const distance = dist(firePosition, obj.translation);
  if(distance <= burnZone){
      this.createTreeFire(obj);
  }
  ```

- **Burning Animation**: Trees change appearance when burning, swapping models and changing scale:
  ```javascript
  if(time > this.burnDuration - .5 && time < this.burnDuration) {
      tree.material = MATERIALS.burntTree;
      tree.mesh_reference = tree.mesh_reference == 'TreeType1.obj' ? 
          'DeadTreeType1.obj': 'DeadTreeType2.obj';
      vec3.scale(tree.scale, tree.burned_scale, 0.75 + 0.25 * 
          (time - this.burnDuration + 0.5) / .5);
  }
  ```

- **User Interaction**: We implemented a ray-casting system that converts screen coordinates to world positions, allowing users to start fires with mouse clicks:
  ```javascript
  const ray = this.camera.screenPointToRay(normalizedX, normalizedY);
  const groundPlaneIntersection = this.intersectRayWithGroundPlane(ray);
  ```

**Performance Optimization**

To keep the game running smoothly:

- **Object Pooling**: Fire and particle effects use object pooling to minimize garbage collection overhead during runtime.
- **Visibility Culling**: Objects outside the camera frustum or beyond a certain distance threshold are excluded from rendering.
- **Level of Detail**: Trees and other complex objects use simplified meshes when viewed from a distance.
- **Batched Updates**: The fire spread system uses time-based batching to distribute computational load across multiple frames.

**UI Integration**

All scenes include:

- **Parameter Display**: A floating status box shows the current state of boolean parameters:
  ```javascript
  updateStatusBox() {
      const params = this.getParamState();
      this.statusBox.innerHTML = Object.entries(params)
          .map(([key, value]) => `${key}: ${value}`)
          .join('<br>');
  }
  ```

- **Keyboard Controls**: Press keys to trigger actions like starting fires:
  ```javascript
  create_hotkey_action("f", () => this.startFireAtCursor(), "Start fire at cursor");
  ```



#### Validation

TODO


### Bloom

#### Implementation

Our bloom implementation follows a multi-stage post-processing pipeline that brightens areas of the scene with a glow effect. The implementation consists of four key stages:

1. **Bright Pass Extraction**: We first extract the bright areas of the scene using a threshold-based filter in [light_extraction.frag.glsl](../src/render/shaders/light_extraction.frag.glsl). This shader calculates the luminance of each pixel using the standard RGB-to-luminance conversion weights (0.2126, 0.7152, 0.0722) and compares it against a configurable threshold. Only pixels exceeding this threshold contribute to the bloom effect, with their intensity scaled by a user-defined multiplier.

```glsl
float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
if (brightness > u_threshold) {
    gl_FragColor = vec4(color.rgb * u_intensity, 1.0);
} else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
```

2. **Gaussian Blur**: We apply a two-pass separable Gaussian blur to the extracted bright areas using ping-pong rendering between two framebuffers. This approach significantly improves performance compared to a single-pass 2D blur by separating the horizontal and vertical blur components. Our Gaussian kernel uses pre-calculated weights for a 9-tap filter (4 samples on each side plus the center pixel) to achieve a smooth blur effect while maintaining performance.

```glsl
// Pre-calculated Gaussian weights for optimal performance
const float weight0 = 0.227027; // Center weight
const float weight1 = 0.1945946; // First offset weight
// ... weights for other samples
```

The number of blur passes is configurable (default: 5), allowing us to control the bloom radius without increasing the kernel size, which would impact performance.

3. **Bloom Combination**: The final stage combines the original scene with the blurred bright areas using a modified additive blend in [bloom_combine.frag.glsl](../src/render/shaders/bloom_combine.frag.glsl). We implemented a luminance-aware blending formula that prevents color shifting when multiple light sources are present:

```glsl
vec3 blendedColor = original.rgb + bloomColor * (1.0 - originalLuminance * 0.5);
```

This approach reduces the bloom contribution in already bright areas, preventing over-saturation.

4. **Tone Adjustment**: We have exposure control and soft saturation adjustment to the final image to ensure the bloom effect enhances the scene without creating unrealistic results:

```glsl
vec3 result = blendedColor * u_exposure;
float luminance = dot(result, vec3(0.2126, 0.7152, 0.0722));
vec3 saturationAdjusted = mix(vec3(luminance), result, 0.9);
```

Our implementation uses floating-point textures throughout the pipeline to preserve high dynamic range information, which is crucial for realistic bloom effects. The entire process is encapsulated in the [BloomShaderRenderer](../src/render/shader_renderers/bloom_sr.js) class, which manages the framebuffers, textures, and shader passes required for the effect.

#### Validation

We validated our bloom implementation through both visual assessment and performance testing:

1. **Visual Quality**: The bloom effect successfully enhances bright areas like fire particles, light sources, and emissive materials without washing out the scene. The effect is particularly noticeable in night scenes, where light sources create a realistic glow that softly illuminates nearby objects.

2. **Performance**: The effect runs at 60+ FPS even with multiple lights. Our two-pass blur approach is much faster than a single-pass 2D blur.

3. **Configurability**: The implementation exposes key parameters through the UI:
   - Bloom threshold: Controls which areas of the scene contribute to the bloom effect
   - Bloom intensity: Adjusts the strength of the bloom effect
   - Exposure: Fine-tunes the overall brightness of the final image

These parameters allow users to customize the bloom effect to suit different scenes and lighting conditions.


### Toon Shaders

#### Implementation

Our toon shader creates a cartoon look by using stepped lighting instead of smooth gradients. We weren't satisfied with just the toon effect, so we added better edge detection. Here's how it works:

1. **Quantized Lighting**: The core of our toon shader is the discretization of diffuse and specular lighting components in [toon.frag.glsl](../../render/shaders/toon.frag.glsl). Rather than using smooth gradients, we quantize these values into a configurable number of discrete bands:

```glsl
// Quantize diffuse lighting into discrete bands
float diffuse_floor = floor(diffuse * float(toon_levels)) / float(toon_levels);
float diffuse_ceil = diffuse_floor + (1. / float(toon_levels));
diffuse = diffuse_floor + (diffuse_ceil - diffuse_floor) / 2.;

// Similarly quantize specular highlights
float specular_floor = floor(specular * float(toon_levels)) / float(toon_levels);
float specular_ceil = specular_floor + (1. / float(toon_levels));
specular = specular_floor + (specular_ceil - specular_floor) / 2.;
```

This approach creates the characteristic "stepped" appearance of toon shading, where lighting changes occur in distinct jumps rather than smooth transitions. The number of bands (`toon_levels`) is configurable through the UI, allowing users to adjust the stylization level from subtle (many bands) to extreme (few bands).

2. **Light Attenuation**: We implemented a distance-based attenuation model that maintains the stylized look while providing realistic light falloff:

```glsl
float light_distance = length(light_position - v2f_frag_pos);
float attenuation = max(0., 1.0 - light_distance / light_radius);
```

This linear attenuation model is simpler than physically-based attenuation but better suits the nature of toon shading.

3. **Light Combining**: We add up the contributions from multiple lights while keeping the cartoon look:

```javascript
blend() {
    // Use additive blending to accumulate light contributions
    return {
        enable: true,
        func: {
            src: 'one',
            dst: 'one',
        },
    };
}
```

4. **Deferred Rendering**: We created a deferred version of the toon shader ([toon_deferred_sr.js](../src/render/shader_renderers/deferred/toon_deferred_sr.js)) that works with our deferred pipeline. It gets lighting info from the G-buffer and applies the same toon effect.

5. **Sobel Edge Detection**: While our initial toon shader implementation provided the characteristic banded lighting, we found that it didn't create sufficiently defined outlines for a true cartoon look. To address this, we implemented a post-processing Sobel filter in [sobel_outline.frag.glsl](../src/render/shaders/sobel_outline.frag.glsl) that detects and emphasizes object silhouettes based on depth discontinuities:

```glsl
// Sample neighboring pixels for depth
float depth_right = texture2D(depth_texture, v2f_uv + vec2(texel.x, 0.0)).r;
float depth_left = texture2D(depth_texture, v2f_uv + vec2(-texel.x, 0.0)).r;
float depth_up = texture2D(depth_texture, v2f_uv + vec2(0.0, texel.y)).r;
float depth_down = texture2D(depth_texture, v2f_uv + vec2(0.0, -texel.y)).r;

// Calculate depth differences
float depth_diff_x = abs(depth_right - depth_left);
float depth_diff_y = abs(depth_up - depth_down);

// Calculate edge strength based on depth changes
float edge_x = step(depth_threshold, depth_diff_x);
float edge_y = step(depth_threshold, depth_diff_y);
```

This gives us clean, sharp outlines around objects that really sell the cartoon look. The [SobelOutlineShaderRenderer](../src/render/shader_renderers/sobel_outline_sr.js) adds these outlines as a final step, so it works with both rendering methods.

The complete toon shader implementation is encapsulated in the [ToonShaderRenderer](../src/render/shader_renderers/toon_sr.js) class, which handles the rendering of objects with toon shading. Objects can opt out of toon shading by including the 'no_toon' property in their material properties.

#### Validation

We tested our toon shader for looks and performance:

1. **Visual Results**: The shader creates a distinct cartoon look that's clearly different from realistic rendering. The stepped lighting makes objects easier to read visually.

2. **Compatibility with Other Features**: The toon shader works seamlessly with our other rendering features:
   - It integrates with the bloom effect, allowing toon-shaded objects to contribute to the scene's glow
   - It supports both forward and deferred rendering paths with consistent visual results
   - It works with our particle systems, creating stylized fire and smoke effects

3. **Performance**: The toon shader runs well even with multiple light sources due to its simplified lighting calculations. On mid-range hardware, we observed no significant performance difference between toon shading and our standard Blinn-Phong shader.

4. **Configurability**: The implementation exposes key parameters through the UI:
   - Toon levels: Controls the number of discrete lighting bands
   - Outline threshold: Adjusts the sensitivity of edge detection for outlines
   - Outline color: Sets the color of cartoon outlines
   - Outline thickness: Controls the width of Sobel-detected edges
   - Depth threshold: Fine-tunes the depth difference required to detect an edge

These parameters allow users to fine-tune the toon effect to achieve different stylistic goals, from subtle cel-shading to bold comic-book styles.


### Deferred Shading

#### Implementation

Our deferred shading pipeline uses a standard G-buffer, storing camera-space position, normal, and albedo (material color) vectors, along with a specular intensity scalar, in three color buffers inside the G-buffer. We found storing camera-space vectors to be simpler for our needs than storing world-space vectors like most tutorials recommend.

We created a `gBuffer` framebuffer in `scene_renderer` with three color textures, and then rendered our `GBufferShaderRenderer` into it with `gBuffer.use(...)` every tick. (This is equivalent to `regl({framebuffer: gBuffer})(...)`.) We also clear the framebuffer each tick too. The G-buffer fragment shader writes to the `gl_FragData[]` array which stores our data in the framebuffer's textures.

To use the G-buffer we created modifications of our shaders to take the global `gBuffer` framebuffer as an argument in `render()`. We index the `gBuffer.color[]` array to access our geometry data. We use a unified vertex shader `deferred.vert.glsl` to pass buffer data to all the inputs of the deferred fragment shaders.

We rewrote the deferred versiosn of the lighting shaders to use light volumes. Instead of iterating over lights per object, each light is represented as a sphere mesh, and shading is computed per fragment within the light volume using additive blending and front-face culling. We adjusted the non deferred shaders (without changed the original computation) so that we could compare the two more easily.

All lights use the same mesh so in theory we could render them with GPU instancing.

#### Validation

TODO


### Particle Effects

#### Implementation

We began by implementing a basic billboard shader ([billboard.frag.glsl](../src/render/shaders/billboard.frag.glsl) and [billboard.vert.glsl](../src/render/shaders/billboard.vert.glsl)). To support real particle systems, we extended our particle containers ([fire_and_smoke.js](../src/scene_resources/fire_and_smoke.js) and [rainbow_vomit_particles.js](../src/scene_resources/rainbow_vomit_particles.js)) to store lists of particles and render the same mesh instance for each one. Initial performance was poor, as the draw logic iterated over each particle on the CPU (JavaScript side). To address this, we implemented GPU instancing, allowing us to upload particle data, such as position offsets, colors, and sizes, in a single draw call per container. This optimization significantly improved rendering performance. We still use the original billboard fragment and vertex shaders for our particles, but we could replace them with alternate shaders, e.g., shaders that render 3D meshes to achieve 3D particles instead. 

We removed the original `billboard_sr.js` file after we were able to fully replicate our 'billboard' with a particle container.

#### Validation

TODO


## Discussion

### Additional Components

- Overlay for skybox for a toggleable night mode
- Natural fire spread
- Manual fire spread (F key)
- 


### Failed Experiments

- Shadows

### Challenges

- Deferred Shading
- Particles
- Fire spread


## Contributions

<table>
	<caption>Worked hours</caption>
	<thead>
		<tr>
			<th>Name</th>
			<th>Week 1</th>
			<th>Week 2</th>
			<th>Week 3</th>
			<th>Week 4</th>
			<th>Week 5</th>
			<th>Week 6</th>
			<th>Week 7</th>
			<th>Total</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Leopold Popper</td>
			<td>1</td>
			<td style="background-color: #f0f0f0;">2</td>
			<td>0</td>
			<td>10</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>Ali Gorgani</td>
			<td>1</td>
			<td style="background-color: #f0f0f0;">1</td>
			<td>0</td>
			<td>11</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>Anthony Tamberg</td>
			<td>1</td>
			<td style="background-color: #f0f0f0;">0</td>
			<td>0</td>
			<td>9</td>
			<td>6</td>
			<td>14</td>
			<td>10</td>
			<td>40</td>
		</tr>
	</tbody>
</table>

<table>
	<caption>Individual contributions</caption>
	<thead>
		<tr>
			<th>Name</th>
			<th>Contribution</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Leopold Popper</td>
			<td>1/3</td>
		</tr>
		<tr>
			<td>Ali Gorgani</td>
			<td>1/3</td>
		</tr>
		<tr>
			<td>Anthony Tamberg</td>
			<td>1/3</td>
		</tr>
	</tbody>
</table>


#### Comments

TODO


## References

- [Regl API](https://github.com/regl-project/regl/blob/main/API.md)
- [Regl GPU Instancing Example](https://github.com/regl-project/regl/blob/b907a63bbb0d5307494657d4028ceca3b4615118/example/instance-mesh.js)
- [Regl Deferred Shading Example](https://github.com/regl-project/regl/blob/main/example/deferred_shading.js)
- [Deferred Shading Tutorial](https://learnopengl.com/Advanced-Lighting/Deferred-Shading)
- [Billboards and Particles Tutorial](https://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/)
