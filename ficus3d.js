import * as THREE from "https://esm.sh/three@0.185.0";
import { OrbitControls } from "https://esm.sh/three@0.185.0/examples/jsm/controls/OrbitControls.js";

const points = [
  { name: "B1", pos: [-23.24, 13.14, 14.6], type: 0 },
  { name: "B2", pos: [-16.0, 13.0, 17.0], type: 0 },
  { name: "B3", pos: [-9.2, 11.0, 17.9], type: 0 },
  { name: "B4", pos: [-22.7, -3.8, 15.5], type: 0 },
  { name: "B5", pos: [-10.8, 2.9, 10.68], type: 0 },
  { name: "B6", pos: [-6.7, 5.4, 13.6], type: 0 },
  { name: "centro", pos: [-10.12, 9.5, 0.5], type: 1 },
  { name: "radcol", pos: [-20.05, 11.5, 8.8], type: 2 },
  { name: "radcol4.1", pos: [-17.03, 2.3, 7.6], type: 2 },
  { name: "radcol4.2", pos: [-22.8, -1.29, 8.6], type: 2 },
  { name: "ins2", pos: [-12.5, 11.77, 6.1], type: 3 },
  { name: "ins3", pos: [-7.9, 11.04, 8.08], type: 3 },
  { name: "ins6", pos: [-8.7, 4.6, 6.3], type: 3 },
  { name: "ins5", pos: [-11.68, 7.2, 6.3], type: 3 }
];

const pointColors = {
  0: 0xe14c3d,
  1: 0x3f73c6,
  2: 0xe4a33f,
  3: 0x3b9a58
};

const branches = [
  ["B1", "radcol"],
  ["B2", "ins2"],
  ["B3", "ins3"],
  ["B4", "radcol4.2"],
  ["B5", "ins5"],
  ["B6", "ins6"]
];

const ropes = [
  ["B1", "B2"],
  ["B2", "B4"],
  ["B1", "B4"],
  ["B2", "B5"],
  ["B4", "B5"],
  ["B2", "B3"],
  ["B3", "B5"],
  ["B3", "B6"],
  ["B5", "B6"]
];

const fenceXY = [
  [-24.7, 21.59],
  [-26.09, 8.59],
  [-24.14, 5.06],
  [-2.8, -8.9]
];

function mapPoint(pos) {
  // orienta i punti nello spazio WebGL
  // Scambia y con z;
  // Converte x = -x NB: !!!!! -pos[0] !!!!!, altrimenti le posizioni risultano speculari
  return [-pos[0], pos[2], pos[1]];
}

function makeLabelSprite(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 96;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 30px Segoe UI";
  ctx.fillStyle = "rgba(20, 34, 18, 0.95)";
  ctx.fillText(text, 8, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.4, 1.65, 1);
  return sprite;
}

function addPoint(scene, point) {
  const geometry = new THREE.SphereGeometry(point.type === 1 ? 0.43 : 0.34, 24, 16);
  const material = new THREE.MeshStandardMaterial({
    color: pointColors[point.type],
    roughness: 0.42,
    metalness: 0.08
  });
  const sphere = new THREE.Mesh(geometry, material);
  const p = mapPoint(point.pos);
  sphere.position.set(...p);
  scene.add(sphere);

  const label = makeLabelSprite(point.name);
  label.position.set(p[0] + 0.65, p[1] + 0.7, p[2] + 0.65);
  scene.add(label);
}

function addCube(scene, point) {
  const geometry = new THREE.BoxGeometry(point.type === 1 ? 1.86 : 0.68, point.type === 1 ? 1.86 : 0.68, point.type === 1 ? 1.86 : 0.68);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff1111, //pointColors[3],// pointColors[point.type],
    roughness: 0.42,
    metalness: 0.08
  });
  const cube = new THREE.Mesh(geometry, material);
  const p = mapPoint(point.pos);
  cube.position.set(...p);
  scene.add(cube);

  const label = makeLabelSprite(point.name);
  label.position.set(p[0] + 0.65, p[1] + 0.7, p[2] + 0.65);
  scene.add(label);
}

function addLine(scene, start, end, color) {
  const a = mapPoint(start);
  const b = mapPoint(end);
  const positions = new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2]]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color });
  scene.add(new THREE.Line(geometry, material));
}

function addPolyline(scene, polyPoints, color) {
  const vectors = polyPoints.map((p) => new THREE.Vector3(...mapPoint(p)));
  const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
  const material = new THREE.LineBasicMaterial({ color });
  scene.add(new THREE.Line(geometry, material));
}

function addLineToGroup(start, end, color, group) {
  const a = mapPoint(start);
  const b = mapPoint(end);
  const positions = new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2]]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color });
  group.add(new THREE.Line(geometry, material));
}

function addCylinderToGroup(start, end, diameter, color, group) {
  const a = new THREE.Vector3(...mapPoint(start));
  const b = new THREE.Vector3(...mapPoint(end));
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  if (length === 0) {
    return;
  }

  const radius = diameter / 2;
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 24);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.08
  });

  const cylinder = new THREE.Mesh(geometry, material);
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  cylinder.position.copy(midpoint);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(cylinder);
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  }
}

export function initFicus3D({
  appId = "app",
  modeSelectId = "modeSelect",
  defaultMode = "rope",
  cameraModeSelectId = "cameraModeSelect",
  defaultCameraMode = "perspective"
} = {}) {
  const app = document.getElementById(appId);
  if (!app) {
    throw new Error(`Elemento #${appId} non trovato.`);
  }

  const scene = new THREE.Scene();
  //scene.background = new THREE.Color("#edf5ea");
  scene.background = new THREE.Color("#ffffff");

  const initialAspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(50, initialAspect, 0.1, 2000);
  const orthoCamera = new THREE.OrthographicCamera(-10 * initialAspect, 10 * initialAspect, 10, -10, 0.1, 2000);
  let activeCamera = camera;
  let orthoHalfHeight = 10;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.appendChild(renderer.domElement);

  let controls = new OrbitControls(activeCamera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.78));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
  keyLight.position.set(32, 44, 16);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#d8eaff", 0.3);
  fillLight.position.set(-26, 18, -22);
  scene.add(fillLight);

  const grid = new THREE.GridHelper(50, 10, "#8ea17b", "#b9c8a9");
  grid.position.y = -0;
  scene.add(grid);

  const axes = new THREE.AxesHelper(8);
  //axes.position.set(-27, -10, -1);
  axes.position.set(0, 0, 0);
  scene.add(axes);

  points.forEach((point) => addPoint(scene, point));

  const byName = Object.fromEntries(points.map((p) => [p.name, p]));

  // posizione del centro dell'albero
  const centro = byName.centro;
  addCube(scene, centro);

  const sez_rope = 0.2;
  const sez_branche = 0.7;
  const colore_stella = new THREE.Color( "#55ffff" );
  const colore_chiusura = new THREE.Color( "#ffff00" );
  const colore_mesh = new THREE.Color( "#ff0000" );
  const colore_branche = new THREE.Color( "#00a2ff" );
  const colore_branche_M = new THREE.Color( "#ff11ff" );

  // branches.forEach(([a, b]) => addLine(scene, byName[a].pos, byName[b].pos, 0xd53333));
  const brancheGroup = new THREE.Group();
  scene.add(brancheGroup);
  branches.forEach(([a, b]) => addCylinderToGroup(byName[a].pos, byName[b].pos, sez_branche, colore_branche, brancheGroup));

  console.log("prima: "+brancheGroup.children[0].name);
  brancheGroup.children[0].name = "B1";
  //console.log("material: "+brancheGroup.children[0].material)
  brancheGroup.children[0].material.color = colore_branche_M;
  brancheGroup.children[3].material.color = colore_branche_M;
  brancheGroup.children[3].name = "B4";
  console.log("dopo: "+brancheGroup.children[0].name+", "+brancheGroup.children[3].name);


  const B1 = byName.B1.pos;
  const B2 = byName.B2.pos;
  const B3 = byName.B3.pos;
  const B4 = byName.B4.pos;
  const centroid = [
    (B1[0] + B2[0] + B3[0] + B4[0]) / 4,
    (B1[1] + B2[1] + B3[1] + B4[1]) / 4,
    (B1[2] + B2[2] + B3[2] + B4[2]) / 4
  ];

  const supportGroup = new THREE.Group();
  scene.add(supportGroup);

  function drawSupports(mode) {
    clearGroup(supportGroup);

    if (mode === "stella") {
      
      /*
      addLineToGroup(B1, centroid, 0x2d69ce, supportGroup);
      addLineToGroup(B2, centroid, 0x2d69ce, supportGroup);
      addLineToGroup(B3, centroid, 0x2d69ce, supportGroup);
      addLineToGroup(B4, centroid, 0x2d69ce, supportGroup);
      */
      
      // stella
      addCylinderToGroup(B1, centroid, sez_rope, colore_stella, supportGroup);
      addCylinderToGroup(B2, centroid, sez_rope, colore_stella, supportGroup);
      addCylinderToGroup(B3, centroid, sez_rope, colore_stella, supportGroup);
      addCylinderToGroup(B4, centroid, sez_rope, colore_stella, supportGroup);

      // Funi di chiusura della stella
      addCylinderToGroup(B1, B2, sez_rope, colore_chiusura, supportGroup);
      addCylinderToGroup(B2, B3, sez_rope, colore_chiusura, supportGroup);
      addCylinderToGroup(B3, B4, sez_rope, colore_chiusura, supportGroup);
      addCylinderToGroup(B4, B1, sez_rope, colore_chiusura, supportGroup);

      return;
    }
    else 
      if (mode === "mesh") {
        ropes.forEach(([a, b]) => {
      addCylinderToGroup(byName[a].pos, byName[b].pos, sez_rope, colore_mesh, supportGroup);
    });
      }
    else return;
  }

  [2, 1.5, 1, 0.5, 0].forEach((z) => {
    const poly = fenceXY.map(([x, y]) => [x, y, z]);
    addPolyline(scene, poly, 0x8b5b34);
  });

  const modeSelect = document.getElementById(modeSelectId);
  if (modeSelect) {
    modeSelect.value = defaultMode;
    drawSupports(modeSelect.value);
    modeSelect.addEventListener("change", (event) => {
      drawSupports(event.target.value);
    });
  } else {
    drawSupports(defaultMode);
  }

  const bounds = new THREE.Box3().setFromObject(scene);
  let size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraDistance = Math.abs((maxDim / 2) / Math.tan(fov / 2));
  cameraDistance *= 1.0; //1.7;

  const cameraPosition = new THREE.Vector3(
    center.x + cameraDistance * 0.65,
    center.y + cameraDistance * 0.45,
    center.z + cameraDistance * 0.65
  );

  camera.position.copy(cameraPosition);

  orthoHalfHeight = Math.max(maxDim * 0.75, 1);
  function updateOrthoFrustum() {
    const aspect = window.innerWidth / window.innerHeight;
    orthoCamera.left = -orthoHalfHeight * aspect;
    orthoCamera.right = orthoHalfHeight * aspect;
    orthoCamera.top = orthoHalfHeight;
    orthoCamera.bottom = -orthoHalfHeight;
    orthoCamera.updateProjectionMatrix();
  }

  updateOrthoFrustum();
  orthoCamera.position.copy(cameraPosition);

  function setCameraMode(mode) {
    const nextCamera = mode === "orthographic" ? orthoCamera : camera;
    if (nextCamera === activeCamera) {
      return;
    }

    const currentPosition = activeCamera.position.clone();
    const currentTarget = controls.target.clone();
    controls.dispose();

    activeCamera = nextCamera;
    activeCamera.position.copy(currentPosition);
    controls = new OrbitControls(activeCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.copy(currentTarget);
    controls.update();
  }

  controls.target.copy(center);
  controls.update();

  const cameraModeSelect = document.getElementById(cameraModeSelectId);
  if (cameraModeSelect) {
    cameraModeSelect.value = defaultCameraMode;
    setCameraMode(cameraModeSelect.value);
    cameraModeSelect.addEventListener("change", (event) => {
      setCameraMode(event.target.value);
    });
  } else {
    setCameraMode(defaultCameraMode);
  }

  window.addEventListener("resize", () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    updateOrthoFrustum();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, activeCamera);
  }

  animate();
}
