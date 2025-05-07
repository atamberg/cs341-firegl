// Adapted from:
// http://callumhay.blogspot.com/2010/09/gaussian-blur-shader-glsl.html
 
precision mediump float;
precision mediump int;

#define PROCESSING_TEXTURE_SHADER

// Define maximum blur size (must be a constant)
#define MAX_BLUR_SIZE 15
 
uniform sampler2D u_texture;
 
// The inverse of the texture dimensions along X and Y
uniform vec2 texOffset;
 
varying vec4 vertColor;
varying vec4 vertTexCoord;
 
uniform int blurSize;       
uniform int horizontalPass; // 0 or 1 to indicate vertical or horizontal pass
uniform float sigma;        // The sigma value for the gaussian function: higher value means more blur
                            // A good value for 9x9 is around 3 to 5
                            // A good value for 7x7 is around 2.5 to 4
                            // A good value for 5x5 is around 2 to 3.5
 
const float pi = 3.14159265;
 
void main() {  
  int numBlurPixelsPerSide = blurSize / 2;
 
  vec2 blurMultiplyVec = horizontalPass > 0 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
 
  // Incremental Gaussian Coefficent Calculation (See GPU Gems 3 pp. 877 - 889)
  vec3 incrementalGaussian;
  incrementalGaussian.x = 1.0 / (sqrt(2.0 * pi) * sigma);
  incrementalGaussian.y = exp(-0.5 / (sigma * sigma));
  incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;
 
  vec4 avgValue = vec4(0.0, 0.0, 0.0, 0.0);
  float coefficientSum = 0.0;
 
  // Take the central sample first...
  avgValue += texture2D(u_texture, vertTexCoord.st) * incrementalGaussian.x;
  coefficientSum += incrementalGaussian.x;
  incrementalGaussian.xy *= incrementalGaussian.yz;
 
  // Use a fixed loop with a conditional break instead of a variable condition
  for (int i = 1; i <= MAX_BLUR_SIZE; i++) {
    if (i > numBlurPixelsPerSide) break;
    
    float fi = float(i);
    avgValue += texture2D(u_texture, vertTexCoord.st - fi * texOffset * 
                        blurMultiplyVec) * incrementalGaussian.x;         
    avgValue += texture2D(u_texture, vertTexCoord.st + fi * texOffset * 
                        blurMultiplyVec) * incrementalGaussian.x;         
    coefficientSum += 2.0 * incrementalGaussian.x;
    incrementalGaussian.xy *= incrementalGaussian.yz;
  }
 
  gl_FragColor = avgValue / coefficientSum;
}
