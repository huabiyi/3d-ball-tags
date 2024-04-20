<template>
    <div class="box-tags">
        <!-- pc 尺寸 -->
        <canvas id="family-tags" width="1200" height="674"></canvas>
        <!-- 移动尺寸 -->
        <!-- <canvas id="family-tags" width="1125" height="1035"></canvas> -->
    </div>
</template>

<script>
import info from "../js/app/info.js";
import BallTags from "../js/app/ballTags.js";

let _tags = info.tags_family;
export default {
    name: 'familyTags',
    mounted() {
        setTimeout(() => {
            this.createTags();
        }, 100);
    },
    methods: {
        createTags() {
            const ballTags = BallTags.create({
                target: '#family-tags',
                tags: _tags,
                size: 50,   // 单个元素的大小
                speed: 2,   // 移动这个速度可以调快些
                rotateSpeed: 1,  // 球体的转动速度， 可设置小数点
                zoomSpeed: 1.2,  // 球体的放大缩小速度， 可设置小数点
            });
        },
    },
}
</script>