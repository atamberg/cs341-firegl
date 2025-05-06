---
title: Milestone Report CS-341 2025
---

# Project Title


## Progress Summary

1. Summarize what you have accomplished so far.

	Enter your features from the proposal in the table below. For each feature, indicate whether you completed the implementation, it is work in progress, or you have to start it.

	<table>
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
				<td style="background-color: #d4edda;">Work in progress</td>
			</tr>
			<tr>
				<td>Bloom</td>
				<td>5</td>
				<td style="background-color: #fff3cd;">Upcoming</td>
			</tr>
			<tr>
				<td>Toon Shaders</td>
				<td>10</td>
				<td style="background-color: #d4edda;">Complete (unpolished)</td>
			</tr>
			<tr>
				<tr>
					<td>Deferred Shading</td>
					<td>15</td>
					<td style="background-color: #cce5ff;">Work in progress</td>
				</tr>
			</tr>
			<tr>
				<td>Particle Effects</td>
				<td>15</td>
				<td style="background-color: #fff3cd;">Complete (unoptimized)</td>
			</tr>
		</tbody>
	</table>

	Add a brief summary of the goals achieved each week. A few words per cell are sufficient.

	<table>
		<caption>Achieved Goals</caption>
		<tr>
			<th></th>
			<th>Leopold Popper</th>
			<th>Ali Gorgani</th>
			<th>Anthony Tamberg</th>
		</tr>
		<tr>
			<td>Week 1 (Proposal)</td>
			<td></td>
			<td>Look into the features to ensure feasibility</td>
			<td></td>
		</tr>
		<tr style="background-color: #f0f0f0;">
			<td>Week 2 (Easter)</td>
			<td></td>
			<td>Research Deferred and Toon Shading</td>
			<td></td>
		</tr>
		<tr>
			<td>Week 3</td>
			<td></td>
			<td>-</td>
			<td></td>
		</tr>
		<tr>
			<td>Week 4</td>
			<td>Mesh work and Bloom</td>
			<td>Deferred Shading and Toon</td>
			<td>Particle Effects</td>
		</tr>
	</table>


2. Show some preliminary results.

	![Our toon shader implementation.](images/toon.png){width="500px"}

	![Billboard implementation](videos/billboard.webm){width="500px"}

	Briefly describe the results you obtained until now and the overall state of the project.

	The results obtained are rudimentary but satisfactory as our approach for the project was to get the harder features working by the first milestone. The overall state of the project is "on track" with a slight hiccup given the easter holiday issue. The unfinished features are also making fast progress, which gives an optimistic view for the state of the project.


3. Optionally present the validation of any feature you have already implemented. This is not mandatory, but can help you get useful feedback for the final report: feature validation will be the main component determining your grade. 

	Follow the following template for each feature you want to validate.

	- Feature Name

		- Implementation

			Briefly describe how you implemented the feature.

		- Validation

			Provide evidence (plots, screenshots, animations, etc.) that the feature works as expected.


4. Report the number of hours each team member worked on the project.

	<table>
		<caption>Worked Hours</caption>
		<tr>
			<th></th>
			<th>Leopold Popper</th>
			<th>Ali Gorgani</th>
			<th>Anthony Tamberg</th>
		</tr>
		<tr>
			<td>Week 1 (Proposal)</td>
			<td>1</td>
			<td>1</td>
			<td>1</td>
		</tr>
		<tr style="background-color: #f0f0f0;">
			<td>Week 2 (Easter)</td>
			<td></td>
			<td>1</td>
			<td>0</td>
		</tr>
		<tr>
			<td>Week 3</td>
			<td></td>
			<td>0</td>
			<td>0</td>
		</tr>
		<tr>
			<td>Week 4</td>
			<td></td>
			<td>11</td>
			<td>9</td>
		</tr>
	</table>

5. Is the project progressing as expected? Was your workload estimate correct? Critically reflect on your work plan and assess if you are on track.

	The 

	Regarding Toon shaders, the workload was split between understanding, to a certain point of course, the rendering pipeline given as a platform and the research regarding how Toon shaders work. 

	Deferred Shading was also attempted, yet it is still a work in progress due to difficulty understanding and implementing the feature. Additionally, we figured that attempting deferred shaders during the final stages of the project might be a better approach as the shader is used for optimizing numerous dynamic light sources within a scene, which is only reached when all other features and scene designs are done.

	

## Schedule Update

1. Acknowledge any delays or unexpected issues, and motivate proposed changes to the schedule, if needed.

	We hadn't realized that Easter break ate into week 3, so we ended up losing that entire week by the time we began working on it on Wednesday. Though, given that we're caught up in the remaining time, we think we're on track.

2. Present the work plan for the remaining weeks.

	<table>
		<caption>Updated Schedule</caption>
		<tr>
			<th></th>
			<th>Leopold Popper</th>
			<th>Ali Gorgani</th>
			<th>Anthony Tamberg</th>
		</tr>
		<tr>
			<td>Week 5</td>
			<td></td>
			<td>Finalize Toon and start bloom shaders</td>
			<td>Optimize particle system</td>
		</tr>
		<tr>
			<td>Week 6</td>
			<td></td>
			<td>Finish bloom shaders and start deferred shading</td>
			<td></td>
		</tr>
		<tr>
			<td>Week 7</td>
			<td></td>
			<td>Finalize deferred shading</td>
			<td></td>
		</tr>
	</table>
