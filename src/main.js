import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
let camera, scene, renderer, composer, screwMesh;

init();
animate();

function init() {
  const container = document.querySelector(".container");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  console.log(container);
  camera = new THREE.PerspectiveCamera(
    60,
    containerWidth / containerHeight,
    1,
    100
  );
  camera.position.set(-30, 0, 0);

  scene = new THREE.Scene();

  new RGBELoader().setPath("textures/").load("neutral.hdr", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = new THREE.Color(0.5, 0.5, 0.5);
    scene.environment = texture;
  });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(containerWidth, containerHeight);
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  container.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // OutlinePass setup
  const outlinePass = new OutlinePass(
    new THREE.Vector2(containerWidth, containerHeight),
    scene,
    camera
  );
  composer.addPass(outlinePass);
  outlinePass.edgeStrength = 3.0;
  outlinePass.edgeGlow = 0.5;
  outlinePass.edgeThickness = 1.0;
  outlinePass.pulsePeriod = 0; // Set to >0 for pulsing effect
  outlinePass.visibleEdgeColor.set(0x00ff00); // White edge
  outlinePass.hiddenEdgeColor.set(0x00ff00); // Black edge
  outlinePass.selectedObjects = [];

  composer.addPass(new OutputPass());

  // renderer.outputEncoding = THREE.sRGBEncoding; // Set the renderer encoding

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener("resize", onWindowResize);

  // Create hexagonal nut shape with a circular hole
  const hexNutShape = new THREE.Shape();
  const hexRadius = 0.5;

  // Define hexagon vertices
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * hexRadius;
    const y = Math.sin(angle) * hexRadius;
    if (i === 0) {
      hexNutShape.moveTo(x, y);
    } else {
      hexNutShape.lineTo(x, y);
    }
  }
  hexNutShape.closePath();

  // Add a circular hole in the center
  const holePath = new THREE.Path();
  const holeRadius = 0.2;
  holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
  hexNutShape.holes.push(holePath);

  // Extrude the hexagonal shape into 3D geometry
  const extrudeSettings = { depth: 0.2, bevelEnabled: false };
  const hexNutGeometry = new THREE.ExtrudeGeometry(
    hexNutShape,
    extrudeSettings
  );
  const hexNutMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  screwMesh = new THREE.Mesh(hexNutGeometry, hexNutMaterial);

  screwMesh.scale.set(0.2, 0.2, 0.2);
  screwMesh.rotation.y = Math.PI / 2;
  screwMesh.visible = false;
  scene.add(screwMesh);

  const loader = new GLTFLoader().setPath("GLB Models/");
  loader.load("TKPrecedent10.glb", async function (gltf) {
    const model = gltf.scene;
    model.scale.set(0.1, 0.1, 0.1);
    model.rotation.y = Math.PI;
    model.position.y -= 10;
    scene.add(model);
    // screwMesh.position.copy(model.position);
    document.querySelector(".progress-bar-container").style.display = "none";
    scene.getObjectByName("tkmain_2").visible = false;
    scene.getObjectByName("tkmain_3").visible = false;
  });

  const menuIcons = document.querySelectorAll(".menuIcon");
  menuIcons.forEach((menuIcon) => {
    menuIcon.addEventListener("click", () => {
      var x = document.getElementById("myLinks");
      const mobileContainer = document.querySelector(".mobile-container");
      if (x.style.display === "block") {
        x.style.display = "none";
        menuIcons[0].style.display = "block";
        menuIcons[1].style.display = "none";
        mobileContainer.style.backgroundColor = "#BCBCBC";
        mobileContainer.style.paddingTop = "20px";
        mobileContainer.style.paddingLeft = "20px";
      } else {
        menuIcons[1].style.display = "block";
        menuIcons[0].style.display = "none";
        x.style.display = "block";
        mobileContainer.style.backgroundColor = "white";
        mobileContainer.style.paddingTop = "0px";
        mobileContainer.style.paddingLeft = "0px";

        const componentName = document.querySelectorAll(".componentName");
        let FaultVale = 0;

        async function processComponentUI(componentUI) {
          return new Promise((resolve) => {
            componentUI.addEventListener("click", async () => {
              FaultVale += 1;
              const settingsIcon = componentUI.querySelector(".settings-icon");
              const spinnerIcon = componentUI.querySelector(".spinner-icon");
              const tickIcon = componentUI.querySelector(".tick-icon");

              settingsIcon.style.display = "none";
              spinnerIcon.style.display = "inline-block";
              tickIcon.style.display = "none";
              setTimeout(() => {
                spinnerIcon.style.display = "none";
                tickIcon.style.display = "inline-block";
                resolve();
                document.querySelector(".expansionVal").innerHTML = "True";
              }, 4000);

              // Move the camera near the component
              camera.position.set(-30, 5, 0);
              let component = scene.getObjectByName(
                componentUI.getAttribute("value")
              );
              const box = new THREE.Box3().setFromObject(component);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const boundingSphere = new THREE.Sphere();
              box.getBoundingSphere(boundingSphere);
              const radius = boundingSphere.radius;
              const frameDistance =
                radius / Math.sin((camera.fov * Math.PI) / 360);
              const direction = new THREE.Vector3();
              direction.subVectors(center, camera.position).normalize();
              camera.position.copy(
                center
                  .clone()
                  .add(direction.multiplyScalar(frameDistance * 1.5))
              );
              camera.lookAt(center);
              const cameraDirection = new THREE.Vector3();
              camera.getWorldDirection(cameraDirection);
              screwMesh.position.copy(
                center
                  .clone()
                  .add(cameraDirection.multiplyScalar(-size.z * 1.2))
              );

              if (controls) {
                controls.target.copy(center);
                controls.update();
              }
              const objectToOutline = component;
              outlinePass.selectedObjects = [objectToOutline];
              composer.render();

              if (componentName.length == FaultVale) {
                screwMesh.visible = false;
              } else {
                screwMesh.visible = true;
              }
            });

            componentUI.click();
          });
        }

        async function processSequentially() {
          for (const componentUI of componentName) {
            await processComponentUI(componentUI);
          }
        }

        processSequentially();
      }
    });
  });
}

function onWindowResize() {
  const container = document.querySelector(".container");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  composer.setSize(containerWidth, containerHeight);
}
function animate() {
  if (screwMesh) {
    screwMesh.rotation.x += 0.05;
  }
  if (composer) composer.render();
  renderer.setAnimationLoop(animate);
}
