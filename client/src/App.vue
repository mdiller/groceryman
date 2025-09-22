<template>
	<div class="qr-app">
		<video ref="video" class="video-feed"></video>

		<ul class="log">
			<li
				v-for="(entry, i) in scannedCodes"
				:key="i"
				:class="{ highlight: entry.highlight }"
			>
				{{ entry.code }}
			</li>
		</ul>

		<button
			class="scan-btn"
			:class="{ active: scanning }"
			@click="toggleScan"
		>
			{{ scanning ? "Stop" : "Scan Codes" }}
		</button>
	</div>
</template>

<script setup>
import { ref } from "vue";
import { BrowserMultiFormatReader } from "@zxing/browser";

const video = ref(null);
const scanning = ref(false);
const scannedCodes = ref([]);
let codeReader = null;

function toggleScan() {
	if (scanning.value) {
		stopScan();
	} else {
		startScan();
	}
}

async function startScan() {
	codeReader = new BrowserMultiFormatReader();
	scanning.value = true;

	try {
		await codeReader.decodeFromVideoDevice(
			null,
			video.value,
			(result, err) => {
				if (result) {
					const text = result.getText();
					if (!scannedCodes.value.some((e) => e.code === text)) {
						const entry = { code: text, highlight: true };
						scannedCodes.value.push(entry);
						console.log("New QR:", text);

						// send to server
						fetch("/qr", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ code: text }),
						});

						// remove highlight after 3s, then fade to white
						setTimeout(() => {
							entry.highlight = false;
						}, 3000);
					}
				}
				// ignore scanning noise
			}
		);
	} catch (e) {
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
</script>

<style scoped>
.qr-app {
	position: relative;
	height: 100vh;
	width: 100vw;
	background: #111;
	color: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	padding-top: 1rem;
}

.video-feed {
	width: 100%;
	max-width: 600px;
	border: 2px solid #444;
	border-radius: 8px;
}

.log {
	margin-top: 1rem;
	list-style: none;
	padding: 0;
	width: 100%;
	text-align: center;
}

.log li {
	color: white;
	transition: color 2s ease;
}

.log li.highlight {
	color: limegreen;
}

.scan-btn {
	position: fixed;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	width: 100px;
	height: 100px;
	border-radius: 50%;
	border: none;
	background: #444;
	color: white;
	font-size: 14px;
	font-weight: bold;
	cursor: pointer;
	transition: background 0.2s;
}
.scan-btn.active {
	background: #28a745;
}
</style>
