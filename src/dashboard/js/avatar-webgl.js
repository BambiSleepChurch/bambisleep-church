/**
 * BambiSleep™ Church MCP Control Tower
 * WebGL Avatar System - GPU-Accelerated Elven Female Avatar
 * 
 * Features:
 * - Fragment shader SDF face rendering
 * - Dynamic expressions (-1 sad to +1 happy)
 * - Lip sync animation
 * - Eye tracking (mouse follow)
 * - Bambi-specific expressions
 * - Theme support (neon/inverted)
 */

/**
 * WebGL Avatar Renderer
 * GPU-accelerated face with real-time animations
 */
export class WebGLAvatar {
  #canvas;
  #gl;
  #program;
  #uniforms = {};
  #state = {
    expression: 0.0,      // -1 (sad) to 1 (happy)
    mouthOpen: 0.0,       // 0 (closed) to 1 (open)
    eyeX: 0.5,            // Eye horizontal position
    eyeY: 0.5,            // Eye vertical position
    blinkState: 0.0,      // 0 (open) to 1 (closed)
    isSpeaking: false,
    theme: 'neon',        // 'neon' or 'inverted'
  };
  #animationFrameId = null;
  #blinkInterval = null;

  constructor(canvas) {
    this.#canvas = canvas;
    this.#gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!this.#gl) {
      throw new Error('WebGL2 not supported');
    }

    this.#initShaders();
    this.#initGeometry();
    this.#setupEventListeners();
    this.#startBlinkCycle();
  }

  /**
   * Initialize WebGL shaders
   * @private
   */
  #initShaders() {
    const gl = this.#gl;

    // Vertex shader (simple passthrough)
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader (SDF face rendering)
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 v_uv;
      out vec4 fragColor;
      
      uniform float u_time;
      uniform float u_expression;
      uniform float u_mouthOpen;
      uniform float u_eyeX;
      uniform float u_eyeY;
      uniform float u_blinkState;
      uniform int u_theme; // 0 = neon, 1 = inverted
      
      // SDF Functions
      float sdCircle(vec2 p, float r) {
        return length(p) - r;
      }
      
      float sdEllipse(vec2 p, vec2 ab) {
        p = abs(p);
        if (p.x > p.y) { p = p.yx; ab = ab.yx; }
        float l = ab.y * ab.y - ab.x * ab.x;
        float m = ab.x * p.x / l;
        float n = ab.y * p.y / l;
        float m2 = m * m;
        float n2 = n * n;
        float c = (m2 + n2 - 1.0) / 3.0;
        float c3 = c * c * c;
        float d = c3 + m2 * n2;
        float q = d + m2 * n2;
        float g = m + m * n2;
        float co;
        if (d < 0.0) {
          float h = acos(q / c3) / 3.0;
          float s = cos(h) + 2.0;
          float t = sin(h) * sqrt(3.0);
          float rx = sqrt(m2 - c * (s + t));
          float ry = sqrt(m2 - c * (s - t));
          co = ry + sign(l) * rx + abs(g) / (rx * ry);
        } else {
          float h = 2.0 * m * n * sqrt(d);
          float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
          float t = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
          float rx = -(s + t) - c * 4.0 + 2.0 * m2;
          float ry = (s - t) * sqrt(3.0);
          float rm = sqrt(rx * rx + ry * ry);
          co = ry / sqrt(rm - rx) + 2.0 * g / rm;
        }
        co = (co - m) / 2.0;
        float si = sqrt(max(1.0 - co * co, 0.0));
        vec2 r = ab * vec2(co, si);
        return length(r - p) * sign(p.y - r.y);
      }
      
      float sdRoundedBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }
      
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      
      // Face SDF
      float sdFace(vec2 p) {
        // Head (ellipse with pointed chin)
        float head = sdEllipse(p - vec2(0.0, 0.1), vec2(0.35, 0.45));
        float chin = sdCircle(p - vec2(0.0, -0.4), 0.15);
        head = smin(head, chin, 0.1);
        
        // Pointed ears (elven style)
        vec2 earL = p - vec2(-0.35, 0.15);
        vec2 earR = p - vec2(0.35, 0.15);
        float earAngle = 0.3;
        mat2 earRot = mat2(cos(earAngle), -sin(earAngle), sin(earAngle), cos(earAngle));
        earL = earRot * earL;
        earR = earRot * -earR;
        float earLeft = sdEllipse(earL, vec2(0.08, 0.15));
        float earRight = sdEllipse(earR, vec2(0.08, 0.15));
        
        return smin(smin(head, earLeft, 0.05), earRight, 0.05);
      }
      
      // Eyes SDF
      vec2 sdEyes(vec2 p) {
        vec2 eyeOffset = vec2(0.15, 0.1);
        float eyeTrackX = (u_eyeX - 0.5) * 0.05;
        float eyeTrackY = (u_eyeY - 0.5) * 0.05;
        
        vec2 leftEyePos = vec2(-eyeOffset.x + eyeTrackX, eyeOffset.y + eyeTrackY);
        vec2 rightEyePos = vec2(eyeOffset.x + eyeTrackX, eyeOffset.y + eyeTrackY);
        
        float eyeHeight = mix(0.1, 0.01, u_blinkState);
        float leftEye = sdEllipse(p - leftEyePos, vec2(0.08, eyeHeight));
        float rightEye = sdEllipse(p - rightEyePos, vec2(0.08, eyeHeight));
        
        return vec2(leftEye, rightEye);
      }
      
      // Mouth SDF
      float sdMouth(vec2 p) {
        float mouthY = -0.1 + u_expression * 0.05;
        float mouthWidth = 0.15 + u_mouthOpen * 0.1;
        float mouthHeight = 0.03 + u_mouthOpen * 0.15;
        float mouthCurve = u_expression * 0.1; // Smile curve
        
        vec2 mouthPos = p - vec2(0.0, mouthY);
        mouthPos.y -= mouthPos.x * mouthPos.x * mouthCurve * 10.0;
        
        return sdEllipse(mouthPos, vec2(mouthWidth, mouthHeight));
      }
      
      void main() {
        vec2 uv = v_uv;
        vec2 p = (uv - 0.5) * 2.0;
        p.y *= -1.0; // Flip Y
        
        // SDF composition
        float face = sdFace(p);
        vec2 eyes = sdEyes(p);
        float mouth = sdMouth(p);
        
        // Colors (theme-aware)
        vec3 bgColor = u_theme == 0 ? vec3(0.05, 0.0, 0.1) : vec3(0.95, 0.95, 1.0);
        vec3 skinColor = u_theme == 0 ? vec3(1.0, 0.9, 0.95) : vec3(0.15, 0.1, 0.05);
        vec3 eyeColor = u_theme == 0 ? vec3(0.4, 0.8, 1.0) : vec3(0.6, 0.2, 0.0);
        vec3 mouthColor = u_theme == 0 ? vec3(1.0, 0.5, 0.7) : vec3(0.0, 0.5, 0.3);
        
        // Glow effect
        float glow = u_theme == 0 ? exp(-abs(face) * 3.0) * 0.3 : 0.0;
        vec3 glowColor = vec3(1.0, 0.5, 0.9);
        
        // Render layers
        vec3 color = bgColor + glowColor * glow;
        
        // Face
        if (face < 0.0) {
          color = skinColor;
          // Shading
          float shade = smoothstep(-0.02, 0.0, face);
          color *= 0.8 + 0.2 * shade;
        }
        
        // Eyes
        if (eyes.x < 0.0 || eyes.y < 0.0) {
          color = eyeColor;
          // Pupils
          vec2 eyeOffset = vec2(0.15, 0.1);
          float eyeTrackX = (u_eyeX - 0.5) * 0.05;
          float eyeTrackY = (u_eyeY - 0.5) * 0.05;
          vec2 leftPupil = p - vec2(-eyeOffset.x + eyeTrackX, eyeOffset.y + eyeTrackY);
          vec2 rightPupil = p - vec2(eyeOffset.x + eyeTrackX, eyeOffset.y + eyeTrackY);
          float pupilLeft = sdCircle(leftPupil, 0.03);
          float pupilRight = sdCircle(rightPupil, 0.03);
          if (pupilLeft < 0.0 || pupilRight < 0.0) {
            color = u_theme == 0 ? vec3(0.1, 0.05, 0.2) : vec3(0.9, 0.95, 0.8);
          }
        }
        
        // Mouth
        if (mouth < 0.0) {
          color = mouthColor;
        }
        
        // Anti-aliasing
        float aa = 0.005;
        float alpha = 1.0;
        if (face > aa) {
          alpha = 0.0;
        } else if (face > 0.0) {
          alpha = 1.0 - smoothstep(0.0, aa, face);
        }
        
        fragColor = vec4(color, alpha);
      }
    `;

    const vertexShader = this.#compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.#compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.#program = gl.createProgram();
    gl.attachShader(this.#program, vertexShader);
    gl.attachShader(this.#program, fragmentShader);
    gl.linkProgram(this.#program);

    if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
      throw new Error('Program link failed: ' + gl.getProgramInfoLog(this.#program));
    }

    // Get uniform locations
    this.#uniforms = {
      time: gl.getUniformLocation(this.#program, 'u_time'),
      expression: gl.getUniformLocation(this.#program, 'u_expression'),
      mouthOpen: gl.getUniformLocation(this.#program, 'u_mouthOpen'),
      eyeX: gl.getUniformLocation(this.#program, 'u_eyeX'),
      eyeY: gl.getUniformLocation(this.#program, 'u_eyeY'),
      blinkState: gl.getUniformLocation(this.#program, 'u_blinkState'),
      theme: gl.getUniformLocation(this.#program, 'u_theme'),
    };
  }

  /**
   * Compile shader
   * @private
   */
  #compileShader(type, source) {
    const gl = this.#gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed: ' + info);
    }

    return shader;
  }

  /**
   * Initialize geometry (fullscreen quad)
   * @private
   */
  #initGeometry() {
    const gl = this.#gl;
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.#program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  }

  /**
   * Setup event listeners
   * @private
   */
  #setupEventListeners() {
    // Eye tracking
    this.#canvas.addEventListener('mousemove', (e) => {
      const rect = this.#canvas.getBoundingClientRect();
      this.#state.eyeX = (e.clientX - rect.left) / rect.width;
      this.#state.eyeY = (e.clientY - rect.top) / rect.height;
    });

    // Reset eye position when mouse leaves
    this.#canvas.addEventListener('mouseleave', () => {
      this.#state.eyeX = 0.5;
      this.#state.eyeY = 0.5;
    });
  }

  /**
   * Start automatic blink cycle
   * @private
   */
  #startBlinkCycle() {
    this.#blinkInterval = setInterval(() => {
      this.#blink();
    }, 4000); // Blink every 4 seconds
  }

  /**
   * Perform a blink animation
   * @private
   */
  #blink() {
    const duration = 150; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Blink curve (0 -> 1 -> 0)
      this.#state.blinkState = Math.sin(progress * Math.PI);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.#state.blinkState = 0;
      }
    };

    animate();
  }

  /**
   * Render frame
   * @private
   */
  #render(time) {
    const gl = this.#gl;

    // Clear
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Use program
    gl.useProgram(this.#program);

    // Set uniforms
    gl.uniform1f(this.#uniforms.time, time / 1000);
    gl.uniform1f(this.#uniforms.expression, this.#state.expression);
    gl.uniform1f(this.#uniforms.mouthOpen, this.#state.mouthOpen);
    gl.uniform1f(this.#uniforms.eyeX, this.#state.eyeX);
    gl.uniform1f(this.#uniforms.eyeY, this.#state.eyeY);
    gl.uniform1f(this.#uniforms.blinkState, this.#state.blinkState);
    gl.uniform1i(this.#uniforms.theme, this.#state.theme === 'neon' ? 0 : 1);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Next frame
    this.#animationFrameId = requestAnimationFrame((t) => this.#render(t));
  }

  /**
   * Start rendering
   */
  start() {
    if (!this.#animationFrameId) {
      this.#animationFrameId = requestAnimationFrame((t) => this.#render(t));
    }
  }

  /**
   * Stop rendering
   */
  stop() {
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }

  /**
   * Set expression (-1 sad to 1 happy)
   * @param {number} value - Expression value
   */
  setExpression(value) {
    this.#state.expression = Math.max(-1, Math.min(1, value));
  }

  /**
   * Set mouth open amount (0 closed to 1 open)
   * @param {number} value - Mouth open value
   */
  setMouthOpen(value) {
    this.#state.mouthOpen = Math.max(0, Math.min(1, value));
  }

  /**
   * Set theme
   * @param {string} theme - 'neon' or 'inverted'
   */
  setTheme(theme) {
    this.#state.theme = theme;
  }

  /**
   * Start speaking animation
   */
  startSpeaking() {
    this.#state.isSpeaking = true;
    
    // Animate mouth with speech pattern
    const speakingLoop = () => {
      if (!this.#state.isSpeaking) return;
      
      // Random mouth movement (simulated phonemes)
      this.#state.mouthOpen = 0.2 + Math.random() * 0.5;
      
      setTimeout(speakingLoop, 100 + Math.random() * 100);
    };
    
    speakingLoop();
  }

  /**
   * Stop speaking animation
   */
  stopSpeaking() {
    this.#state.isSpeaking = false;
    this.#state.mouthOpen = 0;
  }

  // ==================== Bambi Expressions ====================

  /**
   * Happy expression - "Good girl" trigger response
   */
  happy() {
    this.setExpression(1.0);
    this.#blink();
  }

  /**
   * Sleepy expression - "Bambi sleep" trigger
   */
  sleepy() {
    this.setExpression(-0.3);
    this.#state.blinkState = 0.8; // Half-closed eyes
  }

  /**
   * Alert expression - "Bambi wake" trigger
   */
  alert() {
    this.setExpression(0.3);
    this.#state.blinkState = 0;
  }

  /**
   * Reset expression - "Bambi reset" trigger
   */
  reset() {
    this.setExpression(0.0);
    this.#state.mouthOpen = 0.0;
    this.#state.blinkState = 0.0;
  }

  /**
   * Confused expression - "Blonde moment" trigger
   */
  confused() {
    this.setExpression(-0.5);
    this.#state.eyeX = 0.3;
    setTimeout(() => {
      this.#state.eyeX = 0.7;
      setTimeout(() => {
        this.#state.eyeX = 0.5;
      }, 200);
    }, 200);
  }

  /**
   * Comfort expression - "Safe and secure" trigger
   */
  comfort() {
    this.setExpression(0.7);
    this.#state.blinkState = 0.3;
  }

  /**
   * Giggle expression - Playful bubbly response
   */
  giggle() {
    this.setExpression(1.0);
    const giggleSequence = [0.3, 0.6, 0.2, 0.7, 0.1];
    let index = 0;
    
    const giggleLoop = setInterval(() => {
      if (index >= giggleSequence.length) {
        clearInterval(giggleLoop);
        this.setMouthOpen(0);
        return;
      }
      this.setMouthOpen(giggleSequence[index++]);
    }, 150);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    if (this.#blinkInterval) {
      clearInterval(this.#blinkInterval);
    }
    if (this.#gl) {
      this.#gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}

export default WebGLAvatar;
