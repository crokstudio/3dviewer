import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createLayeredContainer } from "./model/layeredContainer.js";

const canvas = document.querySelector("#scene-canvas");
const viewerRegion = document.querySelector(".viewer-region");
const layerList = document.querySelector("#layer-list");
const presetGrid = document.querySelector("#preset-grid");
const visibleCount = document.querySelector("#visible-count");
const presetLabel = document.querySelector("#active-preset-label");
const objectLabels = document.querySelector("#object-labels");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: new URLSearchParams(window.location.search).has("verify"),
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe6e2);
scene.fog = new THREE.Fog(0xdfe6e2, 18, 46);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(10, 6.2, 9.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 4.5;
controls.maxDistance = 28;
controls.target.set(0, 1.5, 0);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const sun = new THREE.DirectionalLight(0xfff4dc, 3.3);
sun.position.set(7, 11, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 34;
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -8;
scene.add(sun);

const ambient = new THREE.HemisphereLight(0xe7f2ff, 0x5b615b, 0.9);
scene.add(ambient);

const fill = new THREE.DirectionalLight(0xb9d5ff, 0.65);
fill.position.set(-8, 4, -5);
scene.add(fill);

const ground = createGround();
scene.add(ground);

const clippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 20);
renderer.clippingPlanes = [clippingPlane];

const model = createLayeredContainer();
scene.add(model.root);

const layerState = new Map(
  model.layers.map((layer) => [
    layer.id,
    {
      visible: true,
      element: null,
      checkbox: null,
      ...layer,
    },
  ]),
);

const presets = [
  {
    id: "all",
    label: "All Layers",
    layers: model.layers.map((layer) => layer.id),
  },
  {
    id: "exterior",
    label: "Exterior",
    layers: ["frame", "walls", "roof", "doors", "floor"],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    layers: ["frame", "floor", "electrical", "cameras", "hvac", "lighting"],
  },
  {
    id: "mep",
    label: "Systems",
    layers: ["electrical", "cameras", "hvac", "plumbing", "lighting"],
  },
  {
    id: "structure",
    label: "Structure",
    layers: ["frame", "walls", "roof", "floor"],
  },
  {
    id: "empty",
    label: "Clear",
    layers: [],
  },
];

const labelAnchors = [
  { id: "electrical", label: "Electrical", point: new THREE.Vector3(-1.8, 3.3, -1.65) },
  { id: "cameras", label: "Cameras", point: new THREE.Vector3(5.4, 3.4, 1.55) },
  { id: "hvac", label: "HVAC", point: new THREE.Vector3(0.2, 3.65, 0.2) },
];

buildPresetControls();
buildLayerControls();
applyPreset("all");
updateExplode(0);
updateSection(1);
resize();
renderer.setAnimationLoop(render);

window.addEventListener("resize", resize);
document.querySelector("#show-all").addEventListener("click", () => applyPreset("all"));
document.querySelector("#hide-all").addEventListener("click", () => applyPreset("empty"));
document.querySelector("#home-view").addEventListener("click", resetCamera);
document.querySelector("#focus-view").addEventListener("click", focusVisibleLayers);
document.querySelector("#explode-range").addEventListener("input", (event) => {
  updateExplode(Number(event.target.value));
});
document.querySelector("#section-range").addEventListener("input", (event) => {
  updateSection(Number(event.target.value));
});
document.querySelector("#xray-shell").addEventListener("change", (event) => {
  setShellXray(event.target.checked);
});

function buildPresetControls() {
  const fragment = document.createDocumentFragment();

  for (const preset of presets) {
    const button = document.createElement("button");
    button.className = "preset-button";
    button.type = "button";
    button.textContent = preset.label;
    button.dataset.preset = preset.id;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => applyPreset(preset.id));
    fragment.append(button);
  }

  presetGrid.append(fragment);
}

function buildLayerControls() {
  const fragment = document.createDocumentFragment();

  for (const layer of model.layers) {
    const label = document.createElement("label");
    label.className = "layer-toggle";
    label.style.setProperty("--layer-color", layer.color);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      setLayerVisible(layer.id, checkbox.checked);
      markCustomPreset();
    });

    const swatch = document.createElement("span");
    swatch.className = "layer-swatch";
    swatch.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "layer-copy";

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layer.name;

    const description = document.createElement("span");
    description.className = "layer-description";
    description.textContent = layer.description;

    copy.append(name, description);
    label.append(checkbox, swatch, copy);
    fragment.append(label);

    const state = layerState.get(layer.id);
    state.element = label;
    state.checkbox = checkbox;
  }

  layerList.append(fragment);
}

function applyPreset(id) {
  const preset = presets.find((candidate) => candidate.id === id);
  if (!preset) {
    return;
  }

  const selected = new Set(preset.layers);
  for (const layer of model.layers) {
    setLayerVisible(layer.id, selected.has(layer.id));
  }

  presetLabel.textContent = preset.label;
  for (const button of presetGrid.querySelectorAll(".preset-button")) {
    button.setAttribute("aria-pressed", String(button.dataset.preset === id));
  }
}

function markCustomPreset() {
  presetLabel.textContent = "Custom";
  for (const button of presetGrid.querySelectorAll(".preset-button")) {
    button.setAttribute("aria-pressed", "false");
  }
}

function setLayerVisible(id, isVisible) {
  const state = layerState.get(id);
  if (!state) {
    return;
  }

  state.visible = isVisible;
  state.group.visible = isVisible;
  state.checkbox.checked = isVisible;
  updateVisibleCount();
  updateLabelVisibility();
}

function updateVisibleCount() {
  const count = [...layerState.values()].filter((layer) => layer.visible).length;
  visibleCount.textContent = `${count}/${model.layers.length}`;
}

function updateExplode(value) {
  for (const layer of model.layers) {
    layer.group.position.copy(layer.basePosition).addScaledVector(layer.explode, value);
  }
}

function updateSection(value) {
  clippingPlane.constant = THREE.MathUtils.lerp(-6.8, 18, (value + 1) / 2);
}

function setShellXray(isEnabled) {
  for (const id of ["walls", "roof", "doors"]) {
    const layer = layerState.get(id);
    for (const material of layer.materials) {
      material.transparent = isEnabled;
      material.opacity = isEnabled ? 0.24 : material.userData.baseOpacity;
      material.depthWrite = !isEnabled;
      material.needsUpdate = true;
    }
  }
}

function resetCamera() {
  camera.position.set(10, 6.2, 9.5);
  controls.target.set(0, 1.5, 0);
  controls.update();
}

function focusVisibleLayers() {
  const box = new THREE.Box3();
  const visibleObjects = model.layers
    .filter((layer) => layer.group.visible)
    .map((layer) => layer.group);

  for (const object of visibleObjects) {
    box.expandByObject(object);
  }

  if (box.isEmpty()) {
    resetCamera();
    return;
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z);
  const distance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const direction = new THREE.Vector3(0.92, 0.45, 0.78).normalize();

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance * 1.55);
  controls.update();
}

function createGround() {
  const group = new THREE.Group();

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0xd2d8d2,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.04;
  plane.receiveShadow = true;
  group.add(plane);

  const grid = new THREE.GridHelper(36, 36, 0x9eaaa3, 0xc4cbc5);
  grid.position.y = 0.002;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  group.add(grid);

  return group;
}

function resize() {
  const width = viewerRegion.clientWidth;
  const height = viewerRegion.clientHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function render() {
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

function updateLabels() {
  for (const anchor of labelAnchors) {
    const element = getLabelElement(anchor);
    const state = layerState.get(anchor.id);
    if (!state?.visible) {
      element.hidden = true;
      continue;
    }

    const projected = anchor.point.clone().applyMatrix4(model.root.matrixWorld).project(camera);
    const isBehindCamera = projected.z > 1;
    element.hidden = isBehindCamera;
    element.style.left = `${((projected.x + 1) / 2) * viewerRegion.clientWidth}px`;
    element.style.top = `${((-projected.y + 1) / 2) * viewerRegion.clientHeight}px`;
  }
}

function updateLabelVisibility() {
  for (const anchor of labelAnchors) {
    const element = getLabelElement(anchor);
    element.hidden = !layerState.get(anchor.id)?.visible;
  }
}

function getLabelElement(anchor) {
  let element = objectLabels.querySelector(`[data-label-id="${anchor.id}"]`);
  if (element) {
    return element;
  }

  element = document.createElement("div");
  element.className = "object-label";
  element.dataset.labelId = anchor.id;
  element.textContent = anchor.label;
  objectLabels.append(element);
  return element;
}
