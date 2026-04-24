'use client';

import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;

  // Pre-normalised direction constants — computed once, not per fragment
  const vec2 d1 = vec2(0.9806,  0.1961);
  const vec2 d2 = vec2(0.9138,  0.4062);
  const vec2 d3 = vec2(0.9806, -0.1961);
  const vec2 d4 = vec2(0.8575,  0.5145);
  const vec2 d5 = vec2(0.3714,  0.9285);
  const vec2 d6 = vec2(-0.3369, 0.9417);
  const vec2 d7 = vec2(0.9806,  0.1961);
  const vec2 d8 = vec2(-0.5145, 0.8575);

  float wave(vec2 uv, vec2 direction, float frequency, float speed, float phase) {
    return sin(dot(uv, direction) * frequency + u_time * speed + phase);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    vec2 uv2 = uv;
    vec2 uv3 = uv;

    uv2.x += sin(uv.y * 3.1 + u_time * 0.18) * 0.04;
    uv2.y += cos(uv.x * 2.8 + u_time * 0.14) * 0.03;

    uv3.x += sin(uv.y * 5.3 + u_time * 0.22) * 0.02;
    uv3.y += cos(uv.x * 4.7 + u_time * 0.19) * 0.02;

    // Primary waves — directional but mid-frequency for visible network
    float w1 = wave(uv2, d1, 3.8, 0.22, 0.00);
    float w2 = wave(uv2, d2, 3.2, 0.18, 2.09);
    float w3 = wave(uv3, d3, 4.2, 0.16, 4.19);
    float w4 = wave(uv3, d4, 2.8, 0.14, 1.05);

    // Cross waves at a meaningful angle — creates the web intersections
    float w5 = wave(uv,  d5, 3.5, 0.13, 0.52);
    float w6 = wave(uv,  d6, 2.9, 0.11, 2.62);

    float primary      = (w1 + w2 + w3 + w4) / 4.0;
    float cross        = (w5 + w6) / 2.0;
    float interference = primary * 0.65 + cross * 0.35;

    // Web-like: sharp bright network over dark water
    float lp  = 1.0 - abs(interference);
    float lp2 = lp * lp;
    float causticGlow = lp2 * lp;               // ~pow(lp, 3) — broad glow
    float causticLine = lp2 * lp2 * lp2 * lp;  // pow(lp, 7) via squaring
    float caustic = causticGlow * 0.4 + causticLine * 0.6;

    float slow1 = wave(uv, d7, 1.8, 0.08, 0.0);
    float slow2 = wave(uv, d8, 1.4, 0.06, 1.8);
    float depth = (slow1 + slow2) * 0.5 * 0.5 + 0.5;

    vec3 pale    = vec3(0.78, 0.88, 0.86);
    vec3 light   = vec3(0.68, 0.82, 0.80);
    vec3 mid     = vec3(0.58, 0.74, 0.72);
    vec3 deep    = vec3(0.48, 0.65, 0.63);
    vec3 white   = vec3(0.86, 0.92, 0.91);
    vec3 gold    = vec3(0.70, 0.82, 0.80);

    vec3 color = mix(deep, mid, depth);
    color = mix(color, light, smoothstep(0.3, 0.6, caustic));
    color = mix(color, pale,  smoothstep(0.55, 0.8, caustic));
    color = mix(color, white, smoothstep(0.72, 1.0, caustic) * 0.18);

    float goldSpot = smoothstep(0.82, 1.0, caustic)
                   * (0.4 + 0.6 * sin(u_time * 0.6
                      + uv.x * 5.0 + uv.y * 3.0));
    color = mix(color, gold, goldSpot * 0.25);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function WaterCanvas({ style = {} }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const uniformsRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') ||
               canvas.getContext('experimental-webgl');

    if (!gl) {
      canvas.style.backgroundColor = '#2C3E3A';
      return;
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positions = new Float32Array([
      -1, -1,  1, -1,  -1,  1,
      -1,  1,  1, -1,   1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      time: gl.getUniformLocation(program, 'u_time'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniformsRef.current.resolution, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    function render() {
      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(uniformsRef.current.time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animRef.current = requestAnimationFrame(render);
    }

    render();

    function handleVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else {
        animRef.current = requestAnimationFrame(render);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
      if (animRef.current) cancelAnimationFrame(animRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
    />
  );
}
