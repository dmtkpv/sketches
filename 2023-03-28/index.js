import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, Shape, ExtrudeGeometry, MeshPhongMaterial, MeshLambertMaterial } from 'https://unpkg.com/three@0.150.1/build/three.module.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';



// -------------------
// Common
// -------------------

const W = 240;
const H = 320;







// -------------------
// Renderer
// -------------------

const renderer = new WebGLRenderer({ stencil: true });
renderer.setClearColor (0xffffff, 1);
renderer.autoClear = false;
document.body.append(renderer.domElement)

const gl = renderer.getContext();

// -------------------
// Camera
// -------------------

const camera = new PerspectiveCamera(90);
camera.position.z = window.innerHeight / 2 / Math.tan(camera.fov * Math.PI / 360);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;





// -------------------
// Rect
// -------------------

function createRect (width, height, r) {

    const shape = new Shape();
    const x = width / 2;
    const y = height / 2;

    shape.moveTo(-x, -y + r);
    shape.lineTo(-x, y - r);
    shape.quadraticCurveTo(-x, y, -x + r, y);
    shape.lineTo(x - r, y);
    shape.quadraticCurveTo(x, y, x, y - r);
    shape.lineTo(x, -y + r);
    shape.quadraticCurveTo(x, -y, x - r, -y);
    shape.lineTo(-x + r, -y);
    shape.quadraticCurveTo(-x, -y, -x, -y + r);

    return shape;

}



// -------------------
// Card
// -------------------

const card = (() => {

    const scene = new Scene();

    // mesh
    const depth = 4;
    const shape = createRect(W, H, 16);
    const geometry = new ExtrudeGeometry(shape, { bevelEnabled: true, depth });
    const material = new MeshLambertMaterial({ color: 0x666666 });
    const mesh = new Mesh(geometry, material);
    mesh.position.z = -depth;
    scene.add(mesh);

    // ambient light
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    // spot light
    const spot = new THREE.SpotLight(0xffffff);
    spot.position.copy(camera.position);
    scene.add(spot);
    controls.addEventListener('change', () => spot.position.copy(camera.position));

    // render
    function render () {
        renderer.render(scene, camera);
    }

    // exports
    return {
        render
    };

})();



// -------------------
// Mask
// -------------------

const mask = (() => {

    const scene = new Scene();

    // mesh
    const shape = createRect(W - 16, H - 16, 12);
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new MeshBasicMaterial({ color: 0x000000 });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    // render
    function render () {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        renderer.render(scene, camera);
        gl.stencilFunc(gl.EQUAL, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }

    // exports
    return {
        render
    }

})();



// -------------------
// Content
// -------------------

const content = (() => {

    const scene = new Scene();

    // texture
    const texture = new THREE.TextureLoader().load("./frame.png");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.1, 0.1 );

    // mesh
    const depth = 500;
    const shape = createRect(W - 16, H - 16, 8);
    const geometry = new ExtrudeGeometry(shape, { bevelEnabled: true, depth });
    const material1 = new MeshBasicMaterial({ transparent: true, opacity: 0 });
    const material2 = new MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    // const material2 = new MeshLambertMaterial({ color: 0x666666, side: THREE.BackSide });
    const mesh = new Mesh(geometry, [material1, material2]);
    mesh.position.z = -depth;
    scene.add(mesh);

    scene.fog = new THREE.Fog( 0x000000, camera.position.z, camera.position.z + depth );

    const loader = new SVGLoader();

    loader.load('logo.svg', data => {

        const depth = 50;
        const size = 120;
        const scale = size / data.xml.viewBox.baseVal.width;

        const [ path ] = data.paths;
        const [ shape ] = SVGLoader.createShapes(path);

        const geometry = new THREE.ShapeGeometry(shape);
        geometry.center();

        const material = new MeshLambertMaterial({ color: 0x666666 });
        const mesh = new Mesh(geometry, material);

        mesh.rotation.z = Math.PI;
        mesh.position.z = -depth;
        mesh.scale.set(scale, scale, 1);
        scene.add(mesh);

    })

    // spot light
    const spot = new THREE.SpotLight(0xffffff);
    spot.position.copy(camera.position);
    scene.add(spot);
    controls.addEventListener('change', () => spot.position.copy(camera.position));

    // render
    function render () {
        renderer.render(scene, camera);
        gl.disable(gl.STENCIL_TEST);
        gl.enable(gl.DEPTH_TEST)
    }

    // exports
    return {
        render
    };

})();




// -------------------
// Render
// -------------------

function render() {
    renderer.clear();
    card.render();
    mask.render();
    content.render();
    controls.update();
    requestAnimationFrame(render);
}



// -------------------
// Resize
// -------------------

function resize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}



// -------------------
// Run
// -------------------

resize();
render();
window.addEventListener('resize', resize);
