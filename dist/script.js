import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";

const canvasEl = document.querySelector("#canvas");
const cleanBtn = document.querySelector(".clean-btn");

const pointer = {
  x: 0.66,
  y: 0.3,
  clicked: true,
};

// for codepen preview
window.setTimeout(() => {
  pointer.x = 0.75;
  pointer.y = 0.5;
  pointer.clicked = true;
}, 700);

let basicMaterial, shaderMaterial;
let renderer = new THREE.WebGLRenderer({
  canvas: canvasEl,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
let sceneShader = new THREE.Scene();
let sceneBasic = new THREE.Scene();
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
let clock = new THREE.Clock();

let renderTargets = [
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
];

createPlane();
updateSize();

window.addEventListener("resize", () => {
  updateSize();
  cleanCanvas();
});

render();

let isTouchScreen = false;

window.addEventListener("click", (e) => {
  if (!isTouchScreen) {
    pointer.x = e.pageX / window.innerWidth;
    pointer.y = e.pageY / window.innerHeight;
    pointer.clicked = true;
  }
});
window.addEventListener("touchstart", (e) => {
  isTouchScreen = true;
  pointer.x = e.targetTouches[0].pageX / window.innerWidth;
  pointer.y = e.targetTouches[0].pageY / window.innerHeight;
  pointer.clicked = true;
});

cleanBtn.addEventListener("click", cleanCanvas);

function cleanCanvas() {
  pointer.vanishCanvas = true;
  setTimeout(() => {
    pointer.vanishCanvas = false;
  }, 50);
}

function createPlane() {
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_stop_time: { type: "f", value: 0 },
      u_stop_randomizer: {
        type: "v2",
        value: new THREE.Vector2(Math.random(), Math.random()),
      },
      u_cursor: { type: "v2", value: new THREE.Vector2(pointer.x, pointer.y) },
      u_ratio: { type: "f", value: window.innerWidth / window.innerHeight },
      u_texture: { type: "t", value: null },
      u_clean: { type: "f", value: 1 },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
  });
  basicMaterial = new THREE.MeshBasicMaterial();
  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const planeBasic = new THREE.Mesh(planeGeometry, basicMaterial);
  const planeShader = new THREE.Mesh(planeGeometry, shaderMaterial);
  sceneBasic.add(planeBasic);
  sceneShader.add(planeShader);
}

function render() {
  shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1;
  shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;

  if (pointer.clicked) {
    shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(
      pointer.x,
      1 - pointer.y
    );
    shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(
      Math.random(),
      Math.random()
    );
    shaderMaterial.uniforms.u_stop_time.value = 0;
    pointer.clicked = false;
  }
  shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();

  renderer.setRenderTarget(renderTargets[1]);
  renderer.render(sceneShader, camera);
  basicMaterial.map = renderTargets[1].texture;
  renderer.setRenderTarget(null);
  renderer.render(sceneBasic, camera);

  let tmp = renderTargets[0];
  renderTargets[0] = renderTargets[1];
  renderTargets[1] = tmp;

  requestAnimationFrame(render);
}

function updateSize() {
  shaderMaterial.uniforms.u_ratio.value =
    window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/*
	This pen cleverly utilizes SVG filters to create a "Morphing Text" effect. Essentially, it layers 2 text elements on top of each other, and blurs them depending on which text element should be more visible. Once the blurring is applied, both texts are fed through a threshold filter together, which produces the "gooey" effect. Check the CSS - Comment the #container rule's filter out to see how the blurring works!
*/

const elts = {
  text1: document.getElementById("text1"),
  text2: document.getElementById("text2"),
};

// The strings to morph between. You can change these to anything you want!
const texts = ["Happy", "Birthday", "to", "Yen", "Nhi", "🌸"];

// Controls the speed of morphing.
const morphTime = 1;
const cooldownTime = 0.25;

let textIndex = texts.length - 1;
let time = new Date();
let morph = 0;
let cooldown = cooldownTime;

elts.text1.textContent = texts[textIndex % texts.length];
elts.text2.textContent = texts[(textIndex + 1) % texts.length];

function doMorph() {
  morph -= cooldown;
  cooldown = 0;

  let fraction = morph / morphTime;

  if (fraction > 1) {
    cooldown = cooldownTime;
    fraction = 1;
  }

  setMorph(fraction);
}

// A lot of the magic happens here, this is what applies the blur filter to the text.
function setMorph(fraction) {
  fraction = Math.cos(fraction * Math.PI) / -2 + 0.5;

  elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

  fraction = 1 - fraction;
  elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

  elts.text1.textContent = texts[textIndex % texts.length];
  elts.text2.textContent = texts[(textIndex + 1) % texts.length];
}

function doCooldown() {
  morph = 0;

  elts.text2.style.filter = "";
  elts.text2.style.opacity = "100%";

  elts.text1.style.filter = "";
  elts.text1.style.opacity = "0%";
}

// Animation loop, which is called every frame.
function animate() {
  requestAnimationFrame(animate);

  let newTime = new Date();
  let shouldIncrementIndex = cooldown > 0;
  let dt = (newTime - time) / 1300;
  time = newTime;

  cooldown -= dt;

  if (cooldown <= 0) {
    if (shouldIncrementIndex) {
      textIndex++;
    }

    doMorph();
  } else {
    doCooldown();
  }
}

// Start the animation.
animate();
