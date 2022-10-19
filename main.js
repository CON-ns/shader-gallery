import * as THREE from "three";
import fox from "./texture/fox.jpg";
import dog from "./texture/dog.jpg";
import bird from "./texture/bird.jpg";
import redPanda from "./texture/red-panda.jpg";
import cat from "./texture/cat.jpg";
//imgを増やしたら、importで読み込む。

let camera, scene, renderer,uniforms,geometry;

//DOMのimg要素を配列で取得
const imageArray = [...document.querySelectorAll('.slide-image')];

//テクスチャの読み込み
//(画像の表示順序は配列に入れる順番で制御、追加で読み込んだら定義して配列に入れる)
const textures = [];
const tex = new THREE.TextureLoader();
const texture = tex.load(fox);
const texture2 = tex.load(dog);
const texture3 = tex.load(bird);
const texture4 = tex.load(redPanda);
const texture5 = tex.load(cat);
textures.push(texture,texture2,texture3, texture4,texture5);

//サイズを定義
const canvas = document.getElementById("canvas");
const sizes = {
  width: innerWidth,
  height: innerHeight,
};

function init() {
  //シーンを定義
  scene = new THREE.Scene();

  //カメラを定義(window座標とwebGL座標を一致させるため調整)
  const fov = 60,
    fovRad = (fov / 2) * (Math.PI / 180), //中心から左右30度ずつの視野角で丁度60度
    aspect = sizes.width / sizes.height,
    dist = sizes.height / 2 / Math.tan(fovRad),
    near = 0.1,
    far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = dist;
  scene.add(camera);

  //レンダラーを定義
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true, //アンチエイリアスを適応
  });
  renderer.setSize(sizes.width, sizes.height); //サイズを指定
  renderer.setClearColor(new THREE.Color(0xEEEEEE));//背景色
  renderer.setPixelRatio(window.devicePixelRatio); //アスペクト比を指定

  // リサイズ（負荷軽減のためリサイズが完了してから発火する）
  window.addEventListener('resize', () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(onWindowResize, 200);
  });
}

//画像をテクスチャにしたPlaneを扱うクラス
class ImagePlane {
  constructor(mesh, img) {
    this.refImage = img;//参照する要素
    this.mesh = mesh;
  }
  setParams() {
    //参照するimg要素から大きさ、位置を取得してセットする
    const rect = this.refImage.getBoundingClientRect();

    this.mesh.scale.x = rect.width;
    this.mesh.scale.y = rect.height;

    //window座標をWebGL座標に変換
    const x = rect.left - sizes.width / 2 + rect.width / 2;
    const y = -rect.top + sizes.height / 2 - rect.height / 2;
    this.mesh.position.set(x, y, this.mesh.position.z);
  }

  update(offset) {
    this.setParams();
    this.mesh.material.uniforms.uTime.value = offset;
  }
}
 
//Meshを生成する用の関数
const createMesh = (geometry,material) => {
  //メッシュ化
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

//materialを生成する用の関数(uniformsの値を引数によって変更する目的)
const createMaterial = (img,index) =>{
  uniforms = {
    uTexture: { value: textures[index] },
    uImageAspect: { value: img.naturalWidth / img.naturalHeight }, // 元画像のアスペクト比
    uPlaneAspect: { value: img.clientWidth / img.clientHeight }, // 画像描画サイズのアスペクト比
    uTime: { value: 0 },
  };

  //マテリアルを定義
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: document.getElementById("v-shader").textContent,
    fragmentShader: document.getElementById("f-shader").textContent,
  });
  return material;
}


const imagePlaneArray = [];//テクスチャを適応したPlaneオブジェクトの配列
//アニメーション実行用関数
function animate() {
  updateScroll();
  for (const plane of imagePlaneArray) {
    plane.update(scrollOffset);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

//material,meshを格納する用の配列を定義
const materials = [];
const meshes = [];
const main = () =>{
  window.addEventListener('load', () => {
    //imgタグの数だけループを回して、順番に
    for (let i = 0; i < imageArray.length; i++) {
      geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
      const img = imageArray[i];
      const material = createMaterial(img, i);
      materials.push(material);
      const mesh = createMesh(geometry, materials[i]);
      meshes.push(mesh);
      scene.add(meshes[i]);
      const imagePlane = new ImagePlane(mesh, img);
      imagePlane.setParams();
      imagePlaneArray.push(imagePlane);
    }
    animate();
  })
}

//リサイズ対応関数
function onWindowResize() {
  sizes = {
    width: innerWidth,
    height: innerHeight,
  };
  // カメラの距離を計算し直す
  const fov = 60;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist = sizes.width / 2 / Math.tan(fovRad);
  camera.position.z = dist;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  main();
  renderer.render(scene, camera);
}

init();
main();

//スクロール量に応じてアニメーションさせる
let targetScrollY = 0; // 本来のスクロール位置
let currentScrollY = 0; // 線形補間を適用した現在のスクロール位置
let scrollOffset = 0; // 上記2つの差分

// 開始と終了をなめらかに補間する関数
const lerp = (start, end, multiplier) => {
  return (1 - multiplier) * start + multiplier * end;
};

const updateScroll = () => {
  // スクロール位置を取得
  targetScrollY = document.documentElement.scrollTop;
  // リープ関数でスクロール位置をなめらかに追従
  currentScrollY = lerp(currentScrollY, targetScrollY, 0.1);
  scrollOffset = targetScrollY - currentScrollY;
};