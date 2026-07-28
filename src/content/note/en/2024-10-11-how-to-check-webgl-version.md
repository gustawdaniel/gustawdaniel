---
title: How to check WebGL / OpenGL version
publishDate: 2024-10-11
----

To check webgl version, type in browser console:

```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

console.log("WebGL Vendor:", vendor);
console.log("WebGL Renderer:", renderer);
```

Exemplary outputs:

```bash
WebGL Vendor: Google Inc. (Mesa)
VM91:8 WebGL Renderer: ANGLE (Mesa, llvmpipe (LLVM 17.0.6 256 bits), OpenGL 4.5)
```

or

```
WebGL Vendor: AMD
WebGL Renderer: Radeon R9 200 Series, or similar
```

or

```
WebGL Vendor: Google Inc. (Intel)
VM178:8 WebGL Renderer: ANGLE (Intel, Mesa Intel(R) Graphics (ADL GT2), OpenGL 4.6)
```

To get your graphic cards.:

```bash
$ lspci -nn | grep -i vga

03:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] Renoir [Radeon RX Vega 6 (Ryzen 4000/5000 Mobile Series)] (rev c2)
```

Check installed AMD drivers

```bash
$ sudo lshw -C display

  *-display                 
       description: VGA compatible controller
       product: Renoir [Radeon RX Vega 6 (Ryzen 4000/5000 Mobile Series)]
       vendor: Advanced Micro Devices, Inc. [AMD/ATI]
       physical id: 0
       bus info: pci@0000:03:00.0
       logical name: /dev/fb0
       version: c2
       width: 64 bits
       clock: 33MHz
       capabilities: pm pciexpress msi msix vga_controller bus_master cap_list fb
       configuration: depth=32 driver=amdgpu latency=0 resolution=1920,1080
       resources: irq:50 memory:d0000000-dfffffff memory:e0000000-e01fffff ioport:e000(size=256) memory:fe400000-fe47ffff
```

Check OpenGL version by `glxinfo`

```bash
$ glxinfo | grep "OpenGL version"

OpenGL version string: 4.5 (Compatibility Profile) Mesa 24.2.4 - kisak-mesa PPA
```
