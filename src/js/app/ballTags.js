import * as THREE from '../lib/three.js';
import Detector from "../lib/Detector.js";
window.THREE = THREE;

require("../lib/TrackballControls.js");

if (!Detector.webgl) Detector.addGetWebGLMessage();

let camera, scene, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let group = new THREE.Group();

let isClick = false;

let select = {   // 点击选中的标签
    prev: null,
    cur: null,
    min: new THREE.Vector3(30, 30, 0),
    max: new THREE.Vector3(60, 60, 0)
};
let moveSelect = null; // 移动选中的标签
let spherical = new THREE.Spherical();
let vector = new THREE.Vector3();

let mouseRotate = { x: 0, y: 0 };

const poiArr = [];
let isMove = false;

let stMouseMove = null;   // 判断是否停止移动

let controllRotate = { x: 0, y: 0, z: 0 };

const BallTags = (() => {
    const fn = {
        create(opt) {
            this.opts = $.extend({}, {
                radius: 200,
                size: 60,   // 单个元素的大小
                speed: 2,   // 点击放大缩小的速度，移动这个速度可以调快些
                rotateSpeed: 1,  // 球体的转动速度， 可设置小数点
                zoomSpeed: 1.2,  // 球体的放大缩小速度， 可设置小数点
                mSpeed: 120   // 鼠标移动时，球体跟着转动的速度
            }, opt);
            this.init();
            this.animate();

            let size = this.opts.size;
            select.min = new THREE.Vector3(size, size, 0);
            select.max = new THREE.Vector3(size * 1.5, size * 1.5, 0);
        },
        init() {
            this.canvas = document.querySelector(this.opts.target);
            this.size = this.canvas.getBoundingClientRect();

            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                canvas: this.canvas
            });

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(this.size.width, this.size.height);

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(48.0, this.size.width / this.size.height, 100, 1500.0);
            camera.position.z = 580.0;
            controllRotate = {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z,
            };

            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            this.controls();
            this.event();
            new THREE.TextureLoader().load(require(`../../img/tag.png`), function (texture) {
                fn.createScene(texture);
            });
        },
        createScene(texture) {  // 生成标签球
            const count = this.opts.tags.length;
            for (let i = 0, l = count; i < l; i++) {
                let vector = fn.getCoordinate(i, count);

                let info = this.opts.tags[i];

                // 纹理效果的修改，需要重新new一个纹理进行赋值
                const mat = fn.setMaterial(fn.drawText(texture, info));
                const obj = new THREE.Sprite(mat);
                obj.name = info.id;
                obj.cn_name = info.name;
                obj.scale.set(this.opts.size, this.opts.size, 1);
                obj.position.set(vector.x, vector.y, vector.z);
                group.add(obj);
            }
            scene.add(group);
        },
        drawText(texture, info) {  // 绘制标签
            const canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            let tag = new THREE.CanvasTexture(canvas);
            canvas.style.letterSpacing = '8px';
            canvas.style.opacity = 0;
            canvas.style.position = 'absolute';
            canvas.width = canvas.height = 256;
            document.querySelector('.box-tags').appendChild(canvas);
            ctx.drawImage(texture.image, 16, 7);
            // 文字绘制
            ctx.beginPath();
            ctx.font = "lighter 42px 'Microsoft YaHei'";
            ctx.fillStyle = "#ebebeb";
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText(info.name, 134, 185);
            tag.needsUpdate = true;
            return tag;
        },
        getCoordinate(num, total) {   // 获取标签初始坐标
            let phi = Math.acos(-1 + (2 * num) / total);
            let theta = Math.sqrt(total * Math.PI) * phi;

            spherical.set(this.opts.radius, phi, theta);
            vector.setFromSpherical(spherical);
            poiArr[num] = { x: vector.x, y: vector.y, z: vector.z };

            return poiArr[num];
        },
        setMaterial(texture) {   // 材质配置
            return new THREE.SpriteMaterial({
                map: texture
            });
        },
        controls() { // 球体的控制器
            controls = new THREE.TrackballControls(camera, renderer.domElement);
            controls.noPan = true;
            controls.minDistance = 100.0;
            controls.maxDistance = 800.0;
            controls.rotateSpeed = this.opts.rotateSpeed || 1.0;
            controls.zoomSpeed = this.opts.zoomSpeed || 1.2;

            // 监听球体是否在变动
            controls.addEventListener('change', function (event) {
                // isMove = false;
                // 获取控制器转动后camera的角度
                controllRotate = {
                    x: camera.rotation.x,
                    y: camera.rotation.y,
                    z: camera.rotation.z,
                };
                console.log('controllRotate', controllRotate);
            });
            controls.addEventListener('end', function () {
                // isMove = true;
            });
        },
        event() {  // 事件监听
            this.canvas.addEventListener('resize', this.onWindowResize, false);
            this.canvas.addEventListener('click', this.onMouseClick, false);
            this.canvas.addEventListener('mousemove', this.onMouseMove, false);
            this.canvas.addEventListener('mouseout', function () {
                isMove = false;
            }, false);
        },

        onWindowResize() {
            camera.aspect = fn.size.width / fn.size.height;
            camera.updateProjectionMatrix();
            renderer.setSize(fn.size.width, fn.size.height);
        },
        onMouseClick(event) {
            mouse.x = ((event.clientX - fn.size.left) / fn.size.width) * 2 - 1;
            mouse.y = - ((event.clientY - fn.size.top) / fn.size.height) * 2 + 1;

            // 通过摄像机和鼠标位置更新射线
            raycaster.setFromCamera(mouse, camera);

            // 计算物体和射线的焦点
            let intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length != 0) {
                let obj = intersects[0].object;
                select.prev = select.cur;
                select.cur = obj;
                isClick = true;
                mouseRotate.direction = null;
                isMove = false;
            }
        },
        onMouseMove(event) {
            mouse.x = ((event.clientX - fn.size.left) / fn.size.width) * 2 - 1;
            mouse.y = - ((event.clientY - fn.size.top) / fn.size.height) * 2 + 1;

            // 保存鼠标移动的坐标，旋转球体使用
            mouseRotate = new THREE.Vector2(-mouse.x, mouse.y);

            // 通过摄像机和鼠标位置更新射线
            raycaster.setFromCamera(mouse, camera);

            // 计算物体和射线的焦点
            let intersects = raycaster.intersectObjects(scene.children, true);

            // 重置 & 设置
            if (intersects.length > 0) {
                let obj = intersects[0].object;
                if (moveSelect != obj) {
                    if (moveSelect) moveSelect.material.opacity = 1;
                    moveSelect = obj;
                    obj.material.opacity = 0.5;
                    clearTimeout(stMouseMove);
                    stMouseMove = setTimeout(() => {
                        isMove = false;
                    }, 100);
                }
            } else {
                if (moveSelect) moveSelect.material.opacity = 1;
                moveSelect = null;
                isMove = true;
            }
        },
        animate() {
            requestAnimationFrame(fn.animate);

            renderer.clear();
            renderer.render(scene, camera);

            controls.update();

            fn.autoRotateBall();
            fn.clickChangeBig();
        },
        autoRotateBall() {   // 旋转球体，改动元素的坐标点(position)，而不是旋转(rotate)
            if (isMove) {
                let a = ((Math.min(Math.max(-mouseRotate.y, -250), 250) / fn.opts.radius) * fn.opts.mSpeed),
                    b = ((Math.min(Math.max(-mouseRotate.x, -250), 250) / fn.opts.radius) * fn.opts.mSpeed),
                    c = 0;

                let csfn = fn.sineCosine(a, b, c);

                if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) {
                    return;
                }
                for (let j = 0; j < poiArr.length; j++) {
                    let rx1 = poiArr[j].x;
                    let ry1 = poiArr[j].y * csfn.ca + poiArr[j].z * (-csfn.sa);
                    let rz1 = poiArr[j].y * csfn.sa + poiArr[j].z * csfn.ca;

                    let rx2 = rx1 * csfn.cb + rz1 * csfn.sb;
                    let ry2 = ry1;
                    let rz2 = rx1 * (-csfn.sb) + rz1 * csfn.cb;

                    let rx3 = rx2 * csfn.cc + ry2 * (-csfn.sc);
                    let ry3 = rx2 * csfn.sc + ry2 * csfn.cc;
                    let rz3 = rz2;

                    poiArr[j].x = rx3;
                    poiArr[j].y = ry3;
                    poiArr[j].z = rz3;
                }
                for (let i = 0; i < poiArr.length; i++) {
                    group.children[i].position.set(poiArr[i].x, poiArr[i].y, poiArr[i].z);
                }
            }
        },
        clickChangeBig() {
            if (isClick) {
                if (select.prev && (select.prev.name == select.cur.name)) {
                    return false;
                }
                if (select.prev && (select.prev.scale.x > select.min.x)) {
                    select.prev.scale.x -= fn.opts.speed;
                    select.prev.scale.y -= fn.opts.speed;
                }

                if (select.cur && (select.cur.scale.x < select.max.x)) {
                    select.cur.scale.x += fn.opts.speed;
                    select.cur.scale.y += fn.opts.speed;
                } else {
                    isClick = false;
                }
            }
        },
        sineCosine(a, b, c) {
            let dtr = Math.PI / 180;
            return {
                sa: Math.sin(a * dtr),
                ca: Math.cos(a * dtr),
                sb: Math.sin(b * dtr),
                cb: Math.cos(b * dtr),
                sc: Math.sin(c * dtr),
                cc: Math.cos(c * dtr),
            };
        }
    };

    return fn;
})();
export default BallTags;