'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, ShaderMaterial } from 'three'
import { PLANET_RADIUS, SKY_COLOR, SKY_HORIZON_COLOR, CLOUD_COLOR, INK_COLOR } from '@/lib/constants'

/**
 * Flat, painted sky in the Messenger manner: a single sky tone that
 * lifts slightly toward the local horizon, with hard-edged cloud shapes
 * and a faint ink contour. Clouds are sampled by view direction, so the
 * sky behaves as if infinitely far away, and "horizon" is measured
 * against the camera's local up (the surface normal), which keeps it
 * correct anywhere on the planet.
 */
export default function PaintedSky() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uSky: { value: new Color(SKY_COLOR) },
          uHorizon: { value: new Color(SKY_HORIZON_COLOR) },
          uCloud: { value: new Color(CLOUD_COLOR) },
          uInk: { value: new Color(INK_COLOR) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uSky;
          uniform vec3 uHorizon;
          uniform vec3 uCloud;
          uniform vec3 uInk;
          uniform float uTime;
          varying vec3 vWorldPosition;

          float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
              f.z);
          }
          float fbm(vec3 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
            return v;
          }

          void main() {
            vec3 dir = normalize(vWorldPosition - cameraPosition);
            vec3 up = normalize(cameraPosition);
            float elev = dot(dir, up);

            // Flat sky, lifting a touch toward the horizon
            vec3 col = mix(uHorizon, uSky, smoothstep(-0.05, 0.35, elev));

            // Stretched, drifting cloud field; thresholded into flat shapes
            vec3 p = dir * vec3(3.2, 5.0, 3.2) + vec3(uTime * 0.006, 0.0, uTime * 0.004);
            float n = fbm(p);
            float thr = 0.62;
            float aa = fwidth(n) * 1.2;
            float cloud = smoothstep(thr - aa, thr + aa, n);
            // Soft inner shadow band gives the painted two-tone look
            float core = smoothstep(thr + 0.06 - aa, thr + 0.06 + aa, n);
            vec3 cloudCol = mix(mix(uCloud, uSky, 0.35), uCloud, core);
            col = mix(col, cloudCol, cloud);
            // Faint ink contour on the cloud edge
            float edge = 1.0 - smoothstep(0.0, aa * 1.6, abs(n - thr));
            col = mix(col, uInk, edge * 0.28);

            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    []
  )

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
  })

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[PLANET_RADIUS * 4, 48, 32]} />
    </mesh>
  )
}
