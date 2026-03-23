<template>
    <div class="section-header">
        <v-icon v-if="icon" class="section-header__icon">{{ icon }}</v-icon>
        <h4 class="section-header__title">{{ title }}</h4>
    </div>
</template>

<script>
export default {
    name: "SectionHeader",
    props: {
        title: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            default: null,
        },
    },
};
</script>
