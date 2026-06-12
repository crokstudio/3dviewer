import * as THREE from "three";

export function createMaterialLibrary() {
  const metalMap = createCorrugatedMetalTexture("#4f887f", "#1d3d3c", "#b76b42");
  const roofMap = createCorrugatedMetalTexture("#6f817f", "#414e4c", "#b8794d");
  const doorMap = createCorrugatedMetalTexture("#55746e", "#263b38", "#c17a42");
  const floorMap = createFloorTexture();
  const cableMap = createCableTexture();

  return {
    frame: standard({
      color: "#23302e",
      metalness: 0.74,
      roughness: 0.36,
      envMapIntensity: 0.9,
    }),
    walls: standard({
      color: "#6faaa0",
      map: metalMap,
      metalness: 0.58,
      roughness: 0.5,
      envMapIntensity: 0.75,
    }),
    roof: standard({
      color: "#7f8e8b",
      map: roofMap,
      metalness: 0.62,
      roughness: 0.54,
      envMapIntensity: 0.72,
    }),
    doors: standard({
      color: "#63847d",
      map: doorMap,
      metalness: 0.62,
      roughness: 0.48,
      envMapIntensity: 0.72,
    }),
    floor: standard({
      color: "#615547",
      map: floorMap,
      metalness: 0.05,
      roughness: 0.68,
      envMapIntensity: 0.35,
    }),
    electrical: standard({
      color: "#f5c542",
      map: cableMap,
      metalness: 0.08,
      roughness: 0.44,
      envMapIntensity: 0.45,
    }),
    conduit: standard({
      color: "#222a2d",
      metalness: 0.35,
      roughness: 0.36,
      envMapIntensity: 0.5,
    }),
    cameras: standard({
      color: "#181d20",
      metalness: 0.48,
      roughness: 0.38,
      envMapIntensity: 0.85,
    }),
    glass: standard({
      color: "#77b8c5",
      metalness: 0.02,
      roughness: 0.08,
      transparent: true,
      opacity: 0.52,
      envMapIntensity: 1.2,
    }),
    hvac: standard({
      color: "#aeb8b5",
      metalness: 0.7,
      roughness: 0.32,
      envMapIntensity: 0.95,
    }),
    plumbing: standard({
      color: "#2784a8",
      metalness: 0.3,
      roughness: 0.38,
      envMapIntensity: 0.55,
    }),
    lighting: standard({
      color: "#fff5d6",
      emissive: "#ffe19a",
      emissiveIntensity: 0.75,
      metalness: 0.03,
      roughness: 0.2,
      envMapIntensity: 0.6,
    }),
    rubber: standard({
      color: "#0f1212",
      metalness: 0,
      roughness: 0.78,
      envMapIntensity: 0.24,
    }),
  };
}

function standard(options) {
  const material = new THREE.MeshStandardMaterial(options);
  material.userData.baseOpacity = options.opacity ?? 1;
  return material;
}

function createCanvasTexture(draw) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  draw(context, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function createCorrugatedMetalTexture(base, shadow, rust) {
  return createCanvasTexture((context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, base);
    gradient.addColorStop(0.52, "#7aa39b");
    gradient.addColorStop(1, shadow);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (let x = 0; x < width; x += 42) {
      context.fillStyle = "rgb(255 255 255 / 0.08)";
      context.fillRect(x, 0, 8, height);
      context.fillStyle = "rgb(0 0 0 / 0.08)";
      context.fillRect(x + 22, 0, 12, height);
    }

    for (let i = 0; i < 900; i += 1) {
      const alpha = Math.random() * 0.07;
      context.fillStyle = `rgb(255 255 255 / ${alpha})`;
      context.fillRect(Math.random() * width, Math.random() * height, Math.random() * 2 + 1, Math.random() * 34 + 4);
    }

    for (let i = 0; i < 34; i += 1) {
      context.fillStyle = rust;
      context.globalAlpha = Math.random() * 0.18 + 0.04;
      context.beginPath();
      context.ellipse(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 30 + 8,
        Math.random() * 12 + 4,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.globalAlpha = 1;
  });
}

function createFloorTexture() {
  return createCanvasTexture((context, width, height) => {
    context.fillStyle = "#5f5549";
    context.fillRect(0, 0, width, height);

    for (let x = 0; x < width; x += 92) {
      context.fillStyle = x % 184 === 0 ? "#6d6254" : "#554c42";
      context.fillRect(x, 0, 84, height);
      context.fillStyle = "rgb(255 255 255 / 0.08)";
      context.fillRect(x + 6, 0, 2, height);
      context.fillStyle = "rgb(0 0 0 / 0.12)";
      context.fillRect(x + 82, 0, 3, height);
    }

    for (let i = 0; i < 1200; i += 1) {
      context.fillStyle = `rgb(255 255 255 / ${Math.random() * 0.06})`;
      context.fillRect(Math.random() * width, Math.random() * height, Math.random() * 28 + 2, 1);
    }
  });
}

function createCableTexture() {
  return createCanvasTexture((context, width, height) => {
    context.fillStyle = "#f5c542";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgb(255 255 255 / 0.35)";
    context.lineWidth = 14;
    for (let y = 44; y < height; y += 96) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + 20);
      context.stroke();
    }
    context.strokeStyle = "rgb(0 0 0 / 0.18)";
    context.lineWidth = 8;
    for (let y = 78; y < height; y += 116) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y - 15);
      context.stroke();
    }
  });
}
