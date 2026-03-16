<template>
    <div class="alert-banner-container">
        <v-alert v-if="!store.labEmailStatus" border="start" type="error" color="#c73460" density="compact"
            class="font-weight-bold mb-2">
            Lab email is not setup properly. Please set it up in the Settings page.
        </v-alert>

        <v-alert v-if="showAdminEmail && !store.adminEmailStatus" border="start" type="warning" color="#c7792c"
            density="compact" class="font-weight-bold mb-2">
            Admin email is not setup properly. Please set it up in the Settings page.
        </v-alert>

        <v-alert v-if="store.trainingMode" border="start" type="warning" color="#c7792c" density="compact"
            class="font-weight-bold mb-2">
            You are running in a training mode.
        </v-alert>
    </div>
</template>

<script>
import { useMainStore } from "@/stores/mainStore";

export default {
    name: "AlertBanner",
    setup() {
        const store = useMainStore();
        return { store };
    },
    props: {
        showAdminEmail: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
