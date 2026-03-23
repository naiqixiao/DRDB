<template>
    <div :class="['info-field', { 'info-field--highlight': highlight, 'info-field--with-icon': icon }]">
        <v-icon v-if="icon" class="info-field__icon">{{ icon }}</v-icon>
        <div :class="icon ? 'info-field__content' : null">
            <span class="info-field__label">{{ label }}</span>
            <span :class="['info-field__value', { 'info-field__value--empty': !displayValue }]">
                <a v-if="type === 'email' && displayValue" :href="'mailto:' + displayValue">{{ displayValue }}</a>
                <a v-else-if="type === 'phone' && displayValue" :href="'tel:' + rawValue">{{ displayValue }}</a>
                <template v-else>{{ displayValue || placeholder }}</template>
            </span>
        </div>
    </div>
</template>

<script>
export default {
    name: "InfoField",
    props: {
        label: {
            type: String,
            required: true,
        },
        value: {
            type: [String, Number, Boolean],
            default: null,
        },
        icon: {
            type: String,
            default: null,
        },
        type: {
            type: String,
            default: null, // 'email', 'phone', or null
        },
        highlight: {
            type: Boolean,
            default: false,
        },
        placeholder: {
            type: String,
            default: "—",
        },
    },
    computed: {
        rawValue() {
            if (this.value == null || this.value === "") return "";
            return String(this.value);
        },
        displayValue() {
            if (this.value == null || this.value === "") return "";
            if (this.type === "phone") return this.formatPhone(this.value);
            if (typeof this.value === "boolean") return this.value ? "Yes" : "No";
            return String(this.value);
        },
    },
    methods: {
        formatPhone(phone) {
            if (!phone) return "";
            const cleaned = String(phone).replace(/\D/g, "");
            const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
            if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
            return String(phone);
        },
    },
};
</script>
