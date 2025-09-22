import { ref } from "vue";
import { BrowserMultiFormatReader } from "@zxing/browser";
const video = ref(null);
const scanning = ref(false);
const scannedCodes = ref([]);
let codeReader = null;
function toggleScan() {
    if (scanning.value) {
        stopScan();
    }
    else {
        startScan();
    }
}
async function startScan() {
    codeReader = new BrowserMultiFormatReader();
    scanning.value = true;
    try {
        await codeReader.decodeFromVideoDevice(null, video.value, (result, err) => {
            if (result) {
                const text = result.getText();
                if (!scannedCodes.value.includes(text)) {
                    scannedCodes.value.push(text);
                    console.log("New QR:", text);
                    // send to express server
                    fetch("http://localhost:3000/qr", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: text }),
                    });
                }
            }
            if (err) {
                // ignore scanning noise
            }
        });
    }
    catch (e) {
        console.error("Error starting scan:", e);
        stopScan();
    }
}
function stopScan() {
    if (codeReader) {
        codeReader.reset();
    }
    scanning.value = false;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['scan-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "qr-app" },
});
__VLS_asFunctionalElement(__VLS_elements.video, __VLS_elements.video)({
    ref: "video",
    ...{ class: "video-feed" },
});
/** @type {typeof __VLS_ctx.video} */ ;
// @ts-ignore
[video,];
__VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
    ...{ class: "log" },
});
for (const [code, i] of __VLS_getVForSourceType((__VLS_ctx.scannedCodes))) {
    // @ts-ignore
    [scannedCodes,];
    __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
        key: (i),
    });
    (code);
}
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.toggleScan) },
    ...{ class: "scan-btn" },
    ...{ class: ({ active: __VLS_ctx.scanning }) },
});
// @ts-ignore
[toggleScan, scanning,];
(__VLS_ctx.scanning ? "Stop" : "Scan Codes");
// @ts-ignore
[scanning,];
/** @type {__VLS_StyleScopedClasses['qr-app']} */ ;
/** @type {__VLS_StyleScopedClasses['video-feed']} */ ;
/** @type {__VLS_StyleScopedClasses['log']} */ ;
/** @type {__VLS_StyleScopedClasses['scan-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        video: video,
        scanning: scanning,
        scannedCodes: scannedCodes,
        toggleScan: toggleScan,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
