import fs from "node:fs";
import path from "node:path";
import streamConsumers from "node:stream/consumers";

import contentDisposition from "content-disposition";
import dotenv from "dotenv";

async function getDowloadUrl(publicKey) {
	const url = new URL("https://cloud-api.yandex.net/v1/disk/public/resources/download");
	url.searchParams.set("public_key", publicKey);

	const result = await fetch(url, { method: "GET" });
	const data = await result.json();

	return new URL(data.href);
}

function logArgs(...args) {
	return ["[YDC]:", ...args];
}

function terminate(message) {
	console.error(...logArgs(message));

	return process.exit(1);
}

function log(...args) {
	console.log(...logArgs(...args));
}

export default async function () {
	const ycConfingFilePath = path.resolve(".ydc");
	if (!fs.existsSync(ycConfingFilePath)) return;

	log(`Found ${ycConfingFilePath}, reading`);

	let ycConfingFileContents;
	try {
		ycConfingFileContents = fs.readFileSync(ycConfingFilePath).toString();
	} catch (error) {
		return terminate(error.message);
	}

	const ycConfingFileLines = ycConfingFileContents.split("\n").map(line => line.trim());
	for (const line of ycConfingFileLines) {
		if (line.includes("https://") &&
			line.includes("disk") &&
			line.includes("ya")) {
			log(`Downloading ${line}`);

			let downloadUrl;
			try {
				downloadUrl = await getDowloadUrl(line);
			} catch (error) {
				return terminate(error.message);
			}

			let fileResponse;
			try {
				fileResponse = await fetch(downloadUrl.href, { method: "GET" });
			} catch (error) {
				return terminate(error.message);
			}

			let contentInfo;
			let fileName;
			try {
				contentInfo = contentDisposition.parse(fileResponse.headers.get("content-disposition"));
			} catch (error) {
				return terminate(error.message);
			}

			try {
				fileName = contentInfo.parameters.filename;
			} catch (error) {
				return terminate("Unknown file name");
			}

			log(`Processing ${fileName}`);

			if (fileName.endsWith(".env") ||
				fileName.includes(".env.")) {
				try {
					fileName = contentInfo.parameters.filename;
					const text = await streamConsumers.text(fileResponse.body);
					const parsedConfig = dotenv.parse(text);
					dotenv.populate(process.env, parsedConfig, { override: true });

					log(`Environment file ${fileName} with ${Object.keys(parsedConfig).length} keys loaded to process.env`);
				} catch (error) {
					return terminate(error.message);
				}
			} else {
				return terminate(`Unknown logic for file processing: ${fileName}`);
			}
		}
	}
}
