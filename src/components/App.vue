<template>
    <div class="main">
        <family-tags></family-tags>
    </div>
</template>

<script>

import familyTags from "./tags.vue";
nie.config.stats.clickStats=true;

export default {
    name: 'app',
    components: { familyTags},
    props: {

    },
    data() {
        return {};
    },
    computed: {
    },

    created() {

    },
    mounted() {
    },
    methods: {
    },
};
</script>


