# Asset and library credits

All character geometry, environment construction, interface artwork, animation,
particle effects, and synthesized audio were authored for War: Survival.

## Three.js

Three.js **0.180.0**, including `HDRLoader.js`, is bundled under the MIT license.
The loader's package import was changed to a local relative import.

- Project: https://threejs.org/
- Source: https://github.com/mrdoob/three.js
- License: [vendor/THREE-LICENSE.txt](../vendor/THREE-LICENSE.txt)

## Poly Haven

The following assets were downloaded from Poly Haven and bundled locally under
the **CC0** license:

| Asset | Included files | Source |
| --- | --- | --- |
| Rock Tile Floor | 2K color; 1K normal and roughness | https://polyhaven.com/a/rock_tile_floor |
| Rock Face 03 | 1K color and normal | https://polyhaven.com/a/rock_face_03 |
| Spruit Sunrise | 1K HDR environment lighting | https://polyhaven.com/a/spruit_sunrise |

Poly Haven license information: https://polyhaven.com/license

The video is a local gameplay and art-direction reference. Its footage,
advertisement interface, audio, textures, and models are not distributed with
this game.

## Main menu artwork

`assets/images/menu-battle-v1.jpg` is original promotional artwork generated with
the built-in imagegen tool for the v0.8.0 menu. It is a 1536×1024 JPEG (399 KB),
loaded locally with no external runtime service. The artwork depicts the jungle
bridge encounter; gameplay continues to use the existing Three.js geometry.
See [menu design notes](menu.md) for the generation prompt and verification.
