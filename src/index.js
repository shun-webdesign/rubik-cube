import './style/main.css'
import * as dat from 'dat.gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let scene, camera, renderer; //シーン、カメラ、レンダラー
let width, height; //幅、高さ
let cubes = new Map();
let group = new THREE.Group();
let status = "ready",cnt,dir;
let mx,my,button = -1, target;


const gui = new dat.GUI();
const guiConfig = {
    activeOrbit: false,
}

const cameraConfig = {
    position: new THREE.Vector3(0,0,0),
    rotation: new THREE.Vector3(0,0,0)
  }

    //画面サイズを取得（幅と高さを補正）
    width = window.innerWidth;
    height = window.innerHeight;

    //シーン、カメラ、レンダラー、ライト（平行光源、環境光）
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, width / height, 1, 50);
    camera.position.set(8,4,2);
    camera.lookAt(scene.position);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width,height);
    document.getElementById("renderArea").appendChild(renderer.domElement);
    scene.add(group);



    const geometry = new THREE.BoxGeometry(0.90,0.90,0.90);
    const color = ["#0000FF","#00ff00","#FFFFFF","#ffd900","#e81717","#FF6600"];
    for(let x=-1; x<2; x++){
        for(let y=-1; y<2; y++){
            for(let z=-1; z<2; z++){
                const materials = new Array();
                const check = [x ==1, x==-1, y==1, y==-1, z==1, z==-1];
                for (let i = 0; i<6; i++){
                let c = "#303030";
                if(check[i]) c = color[i];
                materials[i] = new THREE.MeshBasicMaterial({color:c});
                }
                const cube = new THREE.Mesh(geometry,materials);
                cube.position.set(x,y,z);
                cube.name = `cube_${x}_${y}_${z}`;
                scene.add(cube);
                cubes.set(cube.name, cube);
            }
        }
    }

    //マウスイベントの登録
    const controls = new OrbitControls( camera, renderer.domElement )
    controls.addEventListener('change', e => {
        cameraConfig.position.copy( camera.position )
        cameraConfig.rotation.copy( camera.rotation )
    })
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableRotate = false

    renderer.domElement.addEventListener("mousedown", event => {
        if(status == "ready"){
            [mx, my] = [event.offsetX, event.offsetY];
            [button, target] = [event.button, getIntersectCube(event)];
        }
    });
    renderer.domElement.addEventListener("contextmenu", event => {
        event.preventDefault();
    });
    renderer.domElement.addEventListener("mousemove", event => {
        const [dx, dy] = [event.offsetX-mx, event.offsetY-my];
        if ((status == "ready")&&(Math.hypot(dx, dy) > 0)) {
        if ((button == 0) && ( target != "none")){
            //選択したキューブの列を回転
            const cube = cubes.get(target);
            if (Math.abs(dx) > Math.abs(dy)){
                [status, dir] = ["rotateY", Math.sign(dx)];
                addGroup(null, cube.position.y, null);
            } else {
                [status, dir] = ["rotateZ", -Math.sign(dy)];
                addGroup(null, null, cube.position.z);
            }
        } else if (button == 2){
            //キューブ全体を回転
            addGroup(-1, null, null);
            addGroup(0, null, null);
            addGroup(1, null, null);
            if(Math.abs(dx) > Math.abs(dy)){
                [status, dir] = ["rotateY", Math.sign(dx)];
            } else {
                [status, dir] = ["rotateZ", -Math.sign(dy)];
            }
        }
        cnt = 0;
    }
    });
    renderer.domElement.addEventListener("mouseup", () => button = -1);
    renderer.domElement.addEventListener("mouseleave", () => button = -1);

    const addGroup = (x,y,z) => {
        //グループへの追加
        cubes.forEach(cube => {
            if(((x != null)&&(cube.position.x == x))||
                ((y != null)&&(cube.position.y == y))||
                ((z != null)&&(cube.position.z == z))) {
                scene.remove(cube);
                group.add(cube);
            }
        })
    }

    const removeGroup = () => {
        //グループ解除
        for (let i = group.children.length-1; i>=0; i--) {
            const cube = group.children[i];
            const p = cube.getWorldPosition(new THREE.Vector3());
            const q = cube.getWorldQuaternion(new THREE.Quaternion());
            cube.position.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
            cube.quaternion.copy(q);
            group.remove(cube);
            scene.add(cube);
        }
        group.quaternion.set(0,0,0,1);
    }



    // ルービックキューブのリセット
    const reset = () => {
        if (status == "ready") {
        cubes.forEach((cube) => {
            const pos = cube.name.split("_");
            cube.position.set(pos[1], pos[2], pos[3]);
            cube.quaternion.set(0, 0, 0, 1);
        });
        }
    };

    const shuffle = () => {
        // シャッフル
        if (status === "ready") {
            const shuffleMoves = [];

            for (let i = 0; i < 10; i++) {
                const index = Math.floor(Math.random() * 3);
                const n = Math.floor(Math.random() * 3) - 1;
                const pos = [null, null, null];
                pos[index] = n;
                shuffleMoves.push({ axis: index, direction: n });
            }
            executeShuffle(shuffleMoves, 0);
        }
    };

    const executeShuffle = (shuffleMoves, currentIndex) => {
    if (currentIndex >= shuffleMoves.length) {
        status = "ready";
        removeGroup();
        return;
    }

    const move = shuffleMoves[currentIndex];
    // シャッフルの一手を実行
    addGroup(move.axis === 0 ? move.direction : null, move.axis === 1 ? move.direction : null, move.axis === 2 ? move.direction : null);
    const angle = [0, 0, 0];
    angle[move.axis] = Math.PI / 2;
    group.rotation.set(angle[0], angle[1], angle[2]);
    setTimeout(() => {
        removeGroup();
        executeShuffle(shuffleMoves, currentIndex + 1);
    }, 100);
    };


    // dat.GUIの設定
    gui.add({ reset }, 'reset').name('Reset Cube');
    gui.add({ shuffle }, 'shuffle').name('Shuffle Cube');
    gui.add( guiConfig, 'activeOrbit' )
    .name('コントロールを有効')
    .onChange( value => {
      controls.enableZoom = value
      controls.enablePan = value
      controls.enableRotate = value
    })

    const getIntersectCube = event => {
    //交差するキューブの名前を返す
    const mouse = new THREE.Vector2();
    [mouse.x, mouse.y] = [event.offsetX/width*2-1,event.offsetY/height*(-2)+1];
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersectObject = raycaster.intersectObjects(scene.children)[0];
    let name = "none";
    if (intersectObject != undefined) name = intersectObject.object.name;
    return name
    }

    const update = () => {
    //回転
    const angle = Math.PI/100 * dir;
    if(status == "rotateY") group.rotateY(angle);
    if(status == "rotateZ") group.rotateZ(angle);
    if(status != "ready"){
        cnt++;
        if(cnt == 50) {
        status = "ready";
        removeGroup();
        }
    }
    //レンダリング
    renderer.render(scene, camera);
    window.requestAnimationFrame(update);
    }
    update();
