import * as THREE from '../lib/three.js';
import Detector from "../lib/Detector.js";
window.THREE = THREE;

require("../lib/TrackballControls.js");

if (!Detector.webgl) Detector.addGetWebGLMessage();

let camera, scene, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let group = new THREE.Group();

let isClick = false,
    isBallRotate = false;

let select = {
    prev: null,
    cur: null,
    min: new THREE.Vector3(30, 30, 0),
    max: new THREE.Vector3(60, 60, 0)
};
let moveSelect = {
    prev: null,
    cur: null
};
var spherical = new THREE.Spherical();
var vector = new THREE.Vector3();
const BallTags = (() => {
    const fn = {
        create(opt) {
            this.opts = $.extend({}, {
                radius: 200,
                size: 50,   // 单个元素的大小
                speed: 2,   // 移动这个速度可以调快些
                rotateSpeed: 1,  // 球体的转动速度， 可设置小数点
                zoomSpeed: 1.2,  // 球体的放大缩小速度， 可设置小数点
            }, opt);
            console.log('this.opts', this.opts);
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

            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            this.controls();
            this.event();
            this.createScene();
        },
        createScene() {
            var count = this.opts.tags.length;
            var r = this.opts.radius * 2;

            let maxCount = count * 2;
            let segments = maxCount * maxCount;
            var positions = new Float32Array(segments * 3);
            var colors = new Float32Array(segments * 3);
            var vertexpos = 0;
            var colorpos = 0;
            var particlesData = [];
            var particlePositions, particles;
            var particleCount = 500;
            var numConnected = 0;

            particles = new THREE.BufferGeometry();
            particlePositions = new Float32Array(maxCount * 3);

            for (var i = 0; i < maxCount; i++) {
                fn.getCoordinate(i, count);

                particlePositions[i * 3] = vector.x;
                particlePositions[i * 3 + 1] = vector.y;
                particlePositions[i * 3 + 2] = vector.z;

                // add it to the geometry
                particlesData.push({
                    velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
                    numConnections: 0
                });
            }

            particles.setDrawRange(0, particleCount);
            particles.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setDynamic(true));

            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
            geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));

            geometry.computeBoundingSphere();

            geometry.setDrawRange(0, 0);

            var material = new THREE.LineBasicMaterial({
                color: 0xcccccc,
                vertexColors: THREE.VertexColors,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            var linesMesh = new THREE.LineSegments(geometry, material);
            group.add(linesMesh);

            for (let i = 0, l = count; i < l; i++) {
                fn.getCoordinate(i, count);

                let info = this.opts.tags[i];
                var texture1 = new THREE.TextureLoader().load(require(`../../data/tags/${info.id}.png`));
                texture1.wrapS = texture1.wrapT = THREE.MirroredRepeatWrapping;

                // 纹理效果的修改，需要重新new一个纹理进行赋值
                // const mat = fn.setMaterial(texture1, vector.z < 0?0xffffff:0xffffff);
                const mat = fn.setMaterial(texture1, 0xffffff);
                const obj = new THREE.Sprite(mat);
                obj.center.set(0.5, 0.75);
                obj.name = info.id;
                obj.cn_name = info.name;
                obj.scale.set(this.opts.size, this.opts.size, 1);
                obj.position.set(vector.x, vector.y, vector.z);
                group.add(obj);

                // if (i % 3 == 0) {
                    for (let j = 0; j < count; j++) {
                        var dx = particlePositions[i * 3] - particlePositions[j * 3];
                        var dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
                        var dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
                        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                        if ( dist > 240 && dist < 250) {
                            positions[vertexpos++] = particlePositions[i * 3];
                            positions[vertexpos++] = particlePositions[i * 3 + 1];
                            positions[vertexpos++] = particlePositions[i * 3 + 2];

                            positions[vertexpos++] = particlePositions[j * 3];
                            positions[vertexpos++] = particlePositions[j * 3 + 1];
                            positions[vertexpos++] = particlePositions[j * 3 + 2];

                            colors[colorpos++] = 1;
                            colors[colorpos++] = 1;
                            colors[colorpos++] = 1;
                            colors[colorpos++] = 1;
                            colors[colorpos++] = 1;
                            colors[colorpos++] = 1;

                            numConnected++;
                        }
                    }
                // }
            }

            linesMesh.geometry.setDrawRange(0, numConnected * 2);
            linesMesh.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.attributes.color.needsUpdate = true;

            console.log('group', group);
            scene.add(group);
        },
        getCoordinate(num, total) {
            let phi = Math.acos(-1 + (2 * num) / total);
            let theta = Math.sqrt(total * Math.PI) * phi;

            spherical.set(this.opts.radius || 200, phi, theta);
            vector.setFromSpherical(spherical);
        },
        setMaterial(texture, color) {
            return new THREE.SpriteMaterial({
                map: texture,
                color: color,
                blending: THREE.AdditiveBlending,
            });
        },
        controls() { // 球体的控制器
            controls = new THREE.TrackballControls(camera, renderer.domElement);
            console.log('controls', controls);
            controls.noPan = true;
            controls.minDistance = 100.0;
            controls.maxDistance = 800.0;
            controls.rotateSpeed = this.opts.rotateSpeed || 1.0;
            controls.zoomSpeed = this.opts.zoomSpeed || 1.2;

            // TODO: 处理控制器自动转动
            // controls.rotateCamera(30,30,30);
            // 监听球体是否在变动
            controls.addEventListener('change', function (event) {
            });
        },
        event() {  // 事件监听
            this.canvas.addEventListener('resize', this.onWindowResize, false);
            this.canvas.addEventListener('click', this.onMouseClick, false);
            this.canvas.addEventListener('mousemove', this.onMouseMove, false);
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
            var intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length != 0) {
                let obj = intersects[0].object;
                select.prev = select.cur;
                select.cur = obj;
                isClick = true;
            }
        },
        onMouseMove(event) {
            mouse.x = ((event.clientX - fn.size.left) / fn.size.width) * 2 - 1;
            mouse.y = - ((event.clientY - fn.size.top) / fn.size.height) * 2 + 1;

            // 通过摄像机和鼠标位置更新射线
            raycaster.setFromCamera(mouse, camera);

            // 计算物体和射线的焦点
            var intersects = raycaster.intersectObjects(scene.children, true);

            // 重置 & 设置
            if (intersects.length > 0) {
                let obj = intersects[0].object;
                if (moveSelect.cur != obj) {
                    if (moveSelect.cur) moveSelect.cur.material.opacity = 1;
                    moveSelect.cur = obj;
                    obj.material.opacity = 0.5;
                }
            } else {
                if (moveSelect.cur) moveSelect.cur.material.opacity = 1;
                moveSelect.cur = null;
            }
        },
        animate() {
            requestAnimationFrame(fn.animate);

            renderer.clear();
            renderer.render(scene, camera);

            controls.update();

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
        }
    };

    return fn;
})();
export default BallTags;