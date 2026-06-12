import * as THREE from "three";
import { createMaterialLibrary } from "./materials.js";

const SIZE = {
  length: 12,
  width: 4,
  height: 3.6,
  wallThickness: 0.1,
};

const LAYERS = [
  {
    id: "frame",
    name: "Structural frame",
    description: "Corner posts, beams, forklift pockets",
    color: "#23302e",
    explode: new THREE.Vector3(0, 0.16, 0),
  },
  {
    id: "walls",
    name: "Side walls",
    description: "Corrugated exterior panels",
    color: "#6faaa0",
    explode: new THREE.Vector3(0, 0, -0.85),
  },
  {
    id: "roof",
    name: "Roof",
    description: "Top panel and drip edge",
    color: "#7f8e8b",
    explode: new THREE.Vector3(0, 1.1, 0),
  },
  {
    id: "doors",
    name: "Doors",
    description: "Rear access doors and locking bars",
    color: "#63847d",
    explode: new THREE.Vector3(0.9, 0, 0),
  },
  {
    id: "floor",
    name: "Floor",
    description: "Base plate and wood deck",
    color: "#615547",
    explode: new THREE.Vector3(0, -0.34, 0),
  },
  {
    id: "electrical",
    name: "Electrical circuit",
    description: "Cable trays, conduits, junction boxes",
    color: "#f5c542",
    explode: new THREE.Vector3(0, 0.22, -0.55),
  },
  {
    id: "cameras",
    name: "Cameras",
    description: "Interior and exterior camera assemblies",
    color: "#181d20",
    explode: new THREE.Vector3(0, 0.42, 0.72),
  },
  {
    id: "hvac",
    name: "Ventilation",
    description: "Ducts, fans, intake and exhaust grilles",
    color: "#aeb8b5",
    explode: new THREE.Vector3(0, 0.86, 0),
  },
  {
    id: "plumbing",
    name: "Drainage",
    description: "Condensate and maintenance drain lines",
    color: "#2784a8",
    explode: new THREE.Vector3(0, -0.08, 0.68),
  },
  {
    id: "lighting",
    name: "Lighting",
    description: "Interior LED strips and work lights",
    color: "#fff5d6",
    explode: new THREE.Vector3(0, 0.6, 0),
  },
];

export function createLayeredContainer() {
  const root = new THREE.Group();
  root.name = "ShippingContainer";

  const materials = createMaterialLibrary();
  const groups = new Map();

  for (const layer of LAYERS) {
    const group = new THREE.Group();
    group.name = layer.name;
    groups.set(layer.id, group);
    root.add(group);
  }

  buildFrame(groups.get("frame"), materials);
  buildWalls(groups.get("walls"), materials);
  buildRoof(groups.get("roof"), materials);
  buildDoors(groups.get("doors"), materials);
  buildFloor(groups.get("floor"), materials);
  buildElectrical(groups.get("electrical"), materials);
  buildCameras(groups.get("cameras"), materials);
  buildHvac(groups.get("hvac"), materials);
  buildPlumbing(groups.get("plumbing"), materials);
  buildLighting(groups.get("lighting"), materials);

  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const layers = LAYERS.map((layer) => {
    const group = groups.get(layer.id);
    const layerMaterials = collectMaterials(group);
    return {
      ...layer,
      group,
      materials: layerMaterials,
      basePosition: group.position.clone(),
    };
  });

  return { root, layers };
}

function buildFrame(group, materials) {
  const halfLength = SIZE.length / 2;
  const halfWidth = SIZE.width / 2;
  const height = SIZE.height;
  const postSize = 0.22;
  const beamHeight = 0.24;

  for (const x of [-halfLength, halfLength]) {
    for (const z of [-halfWidth, halfWidth]) {
      addBox(group, [postSize, height, postSize], [x, height / 2, z], materials.frame, `Corner post ${x},${z}`);
    }
  }

  for (const y of [0.12, height - 0.12]) {
    addBox(group, [SIZE.length + postSize, beamHeight, postSize], [0, y, -halfWidth], materials.frame, "Left longitudinal beam");
    addBox(group, [SIZE.length + postSize, beamHeight, postSize], [0, y, halfWidth], materials.frame, "Right longitudinal beam");
    addBox(group, [postSize, beamHeight, SIZE.width + postSize], [-halfLength, y, 0], materials.frame, "Front cross beam");
    addBox(group, [postSize, beamHeight, SIZE.width + postSize], [halfLength, y, 0], materials.frame, "Rear cross beam");
  }

  for (let x = -4.4; x <= 4.4; x += 2.2) {
    addBox(group, [0.18, 0.18, SIZE.width - 0.44], [x, 0.32, 0], materials.frame, "Base crossmember");
  }

  addBox(group, [1.2, 0.18, 0.18], [-2.1, 0.18, -halfWidth - 0.02], materials.frame, "Forklift pocket");
  addBox(group, [1.2, 0.18, 0.18], [2.1, 0.18, -halfWidth - 0.02], materials.frame, "Forklift pocket");
  addBox(group, [1.2, 0.18, 0.18], [-2.1, 0.18, halfWidth + 0.02], materials.frame, "Forklift pocket");
  addBox(group, [1.2, 0.18, 0.18], [2.1, 0.18, halfWidth + 0.02], materials.frame, "Forklift pocket");
}

function buildWalls(group, materials) {
  createCorrugatedSide(group, -SIZE.width / 2, -1, materials.walls);
  createCorrugatedSide(group, SIZE.width / 2, 1, materials.walls);
  createFrontPanel(group, materials.walls);
}

function buildRoof(group, materials) {
  const segmentCount = 44;
  const segmentLength = SIZE.length / segmentCount;
  const y = SIZE.height + 0.03;

  for (let i = 0; i < segmentCount; i += 1) {
    const x = -SIZE.length / 2 + segmentLength * i + segmentLength / 2;
    const height = i % 2 === 0 ? 0.09 : 0.045;
    addBox(group, [segmentLength * 0.92, height, SIZE.width + 0.08], [x, y + height / 2, 0], materials.roof, "Roof corrugation");
  }

  addBox(group, [SIZE.length + 0.16, 0.12, 0.16], [0, y + 0.08, -SIZE.width / 2 - 0.08], materials.roof, "Roof drip edge");
  addBox(group, [SIZE.length + 0.16, 0.12, 0.16], [0, y + 0.08, SIZE.width / 2 + 0.08], materials.roof, "Roof drip edge");
}

function buildDoors(group, materials) {
  const x = SIZE.length / 2 + 0.055;
  const doorWidth = SIZE.width / 2 - 0.18;

  for (const side of [-1, 1]) {
    const centerZ = side * (doorWidth / 2 + 0.05);
    const door = new THREE.Group();
    door.name = side < 0 ? "Left rear door" : "Right rear door";
    door.position.set(x, SIZE.height / 2, centerZ);

    addBox(door, [0.12, SIZE.height - 0.45, doorWidth], [0, 0, 0], materials.doors, "Door panel");
    addBox(door, [0.16, 0.12, doorWidth + 0.08], [-0.02, (SIZE.height - 0.52) / 2, 0], materials.frame, "Door rail");
    addBox(door, [0.16, 0.12, doorWidth + 0.08], [-0.02, -(SIZE.height - 0.52) / 2, 0], materials.frame, "Door rail");
    addBox(door, [0.18, SIZE.height - 0.58, 0.1], [-0.03, 0, -doorWidth / 2], materials.frame, "Door stile");
    addBox(door, [0.18, SIZE.height - 0.58, 0.1], [-0.03, 0, doorWidth / 2], materials.frame, "Door stile");

    for (const z of [-doorWidth * 0.25, doorWidth * 0.25]) {
      const bar = createCylinder(0.035, SIZE.height - 0.8, materials.frame, "Door lock bar");
      bar.rotation.z = Math.PI / 2;
      bar.position.set(-0.1, 0.02, z);
      door.add(bar);
    }

    const handle = createCylinder(0.045, 0.5, materials.rubber, "Door handle");
    handle.rotation.x = Math.PI / 2;
    handle.position.set(-0.17, -0.1, -side * doorWidth * 0.38);
    door.add(handle);

    group.add(door);
  }
}

function buildFloor(group, materials) {
  addBox(group, [SIZE.length - 0.35, 0.16, SIZE.width - 0.35], [0, 0.13, 0], materials.floor, "Timber floor deck");
  addBox(group, [SIZE.length + 0.05, 0.12, SIZE.width + 0.05], [0, 0.02, 0], materials.frame, "Steel base pan");

  for (let x = -5; x <= 5; x += 1) {
    addBox(group, [0.06, 0.02, SIZE.width - 0.48], [x, 0.24, 0], materials.rubber, "Floor expansion joint");
  }
}

function buildElectrical(group, materials) {
  addCable(group, [
    [-5.2, 2.95, -1.65],
    [-2.8, 2.95, -1.65],
    [-1.2, 2.7, -1.65],
    [0.7, 2.7, -1.65],
    [2.4, 2.95, -1.65],
    [5.2, 2.95, -1.65],
  ], materials.electrical, 0.035, "Main cable tray");

  addCable(group, [
    [-4.6, 2.85, -1.56],
    [-4.6, 1.55, -1.56],
    [-4.2, 1.25, -1.25],
  ], materials.conduit, 0.026, "Drop conduit");

  addCable(group, [
    [2.8, 2.85, -1.56],
    [2.8, 1.5, -1.56],
    [3.4, 1.12, -1.1],
  ], materials.conduit, 0.026, "Maintenance conduit");

  for (const position of [
    [-4.2, 1.25, -1.18],
    [-0.5, 2.82, -1.62],
    [3.4, 1.12, -1.04],
  ]) {
    addBox(group, [0.42, 0.32, 0.14], position, materials.electrical, "Junction box");
  }
}

function buildCameras(group, materials) {
  const cameraPositions = [
    [-5.35, 3.15, -1.62, Math.PI * 0.75],
    [5.35, 3.15, -1.62, Math.PI * 0.25],
    [5.35, 3.15, 1.62, Math.PI * -0.25],
    [-5.35, 3.15, 1.62, Math.PI * -0.75],
  ];

  for (const [x, y, z, rotationY] of cameraPositions) {
    const camera = new THREE.Group();
    camera.name = "Security camera";
    camera.position.set(x, y, z);
    camera.rotation.y = rotationY;

    const body = createCylinder(0.16, 0.32, materials.cameras, "Camera body");
    body.rotation.z = Math.PI / 2;
    camera.add(body);

    const lens = createCylinder(0.105, 0.035, materials.glass, "Camera lens");
    lens.rotation.z = Math.PI / 2;
    lens.position.x = 0.18;
    camera.add(lens);

    addBox(camera, [0.08, 0.22, 0.24], [-0.24, 0.02, 0], materials.frame, "Camera bracket");
    group.add(camera);
  }
}

function buildHvac(group, materials) {
  const mainDuct = createCylinder(0.18, 7.8, materials.hvac, "Main ventilation duct");
  mainDuct.rotation.z = Math.PI / 2;
  mainDuct.position.set(0, 3.18, 0.92);
  group.add(mainDuct);

  for (const x of [-4, -1.25, 1.25, 4]) {
    const drop = createCylinder(0.11, 0.72, materials.hvac, "Air diffuser drop");
    drop.position.set(x, 2.86, 0.92);
    group.add(drop);

    const diffuser = createCylinder(0.22, 0.06, materials.hvac, "Round diffuser");
    diffuser.position.set(x, 2.48, 0.92);
    group.add(diffuser);
  }

  addBox(group, [1.25, 0.64, 0.24], [-5.2, 2.28, 1.88], materials.hvac, "Intake grille");
  addBox(group, [1.25, 0.64, 0.24], [5.2, 2.28, 1.88], materials.hvac, "Exhaust grille");
}

function buildPlumbing(group, materials) {
  addCable(group, [
    [-5.1, 0.42, 1.45],
    [-2.6, 0.42, 1.45],
    [0.3, 0.35, 1.45],
    [3.2, 0.3, 1.45],
    [5.2, 0.3, 1.45],
  ], materials.plumbing, 0.042, "Drainage line");

  for (const x of [-2.6, 0.3, 3.2]) {
    const cleanout = createCylinder(0.1, 0.16, materials.plumbing, "Cleanout cap");
    cleanout.position.set(x, 0.48, 1.45);
    group.add(cleanout);
  }
}

function buildLighting(group, materials) {
  for (const z of [-0.72, 0.72]) {
    addBox(group, [9.2, 0.035, 0.08], [0, 3.35, z], materials.lighting, "LED strip");

    const stripLight = new THREE.PointLight(0xffe3a6, 0.42, 5.8, 2.2);
    stripLight.position.set(0, 3.08, z);
    group.add(stripLight);
  }

  for (const x of [-4.2, 0, 4.2]) {
    addBox(group, [0.72, 0.045, 0.38], [x, 3.3, 0], materials.lighting, "Service light panel");
  }
}

function createCorrugatedSide(group, z, side, material) {
  const segmentCount = 52;
  const segmentLength = (SIZE.length - 0.46) / segmentCount;
  const y = SIZE.height / 2;

  for (let i = 0; i < segmentCount; i += 1) {
    const x = -SIZE.length / 2 + 0.23 + segmentLength * i + segmentLength / 2;
    const depth = i % 2 === 0 ? 0.1 : 0.055;
    const offset = side * (depth - 0.055) / 2;
    addBox(group, [segmentLength * 0.9, SIZE.height - 0.52, depth], [x, y, z + offset], material, "Side wall corrugation");
  }
}

function createFrontPanel(group, material) {
  const x = -SIZE.length / 2 - 0.055;
  const segmentCount = 16;
  const segmentWidth = (SIZE.width - 0.46) / segmentCount;

  for (let i = 0; i < segmentCount; i += 1) {
    const z = -SIZE.width / 2 + 0.23 + segmentWidth * i + segmentWidth / 2;
    const depth = i % 2 === 0 ? 0.1 : 0.055;
    addBox(group, [depth, SIZE.height - 0.52, segmentWidth * 0.9], [x, SIZE.height / 2, z], material, "Front wall corrugation");
  }
}

function addCable(group, points, material, radius, name) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 72, radius, 12, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

function addBox(group, size, position, material, name) {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

function createCylinder(radius, depth, material, name) {
  const geometry = new THREE.CylinderGeometry(radius, radius, depth, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function collectMaterials(root) {
  const materials = new Set();
  root.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of objectMaterials) {
      if (material) {
        materials.add(material);
      }
    }
  });
  return [...materials];
}
