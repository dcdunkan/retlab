import { UAParser, type IDevice } from "ua-parser-js";
import { DeviceType } from "../prisma/enums";

type ParsedInfo = Record<"browser" | "os" | "device", string | null>;

export type DeviceInfo = {
	label: string | null;
	type: DeviceType;
};

function isValidString(str: unknown): str is string {
	return str != null && typeof str === "string" && str.trim().length > 0;
}

function makeString(...strings: unknown[]) {
	const filtered = strings
		.filter((str) => isValidString(str))
		.map((str) => str.trim()) satisfies string[];
	return filtered.length == 0 ? null : filtered.join(" ");
}

export function getDeviceInfo(userAgent: unknown): DeviceInfo {
	if (!isValidString(userAgent))
		return {
			label: null,
			type: DeviceType.UNKNOWN
		};

	const { browser, cpu, device, os } = UAParser(userAgent);

	const info: ParsedInfo = {
		browser: makeString(browser.name, browser.major || browser.version),
		os: makeString(os.name, os.version),
		device: (() => {
			if (!isValidString(device.vendor)) return null;
			const dev = makeString(device.vendor, device.model);
			return dev == null ? dev : makeString(dev, cpu.architecture);
		})()
	};

	if (Object.keys(info).every((key) => info[key as keyof ParsedInfo] == null)) {
		return { label: null, type: resolveDeviceType(device) };
	}

	return {
		label: stringifyDeviceInfo(info) || null,
		type: resolveDeviceType(device)
	};
}

function resolveDeviceType(device: IDevice): DeviceType {
	return device.type == null
		? DeviceType.UNKNOWN
		: device.type === "mobile"
			? DeviceType.MOBILE
			: DeviceType.LAPTOP;
}

function stringifyDeviceInfo(info: ParsedInfo): string {
	const isBrowserAvailable = isValidString(info.browser);
	const isOSAvailable = isValidString(info.os);

	const out: string[] = [];

	if (isValidString(info.browser)) {
		out.push(info.browser);
	}
	if (isValidString(info.os)) {
		if (isBrowserAvailable) {
			out.push("on");
		}
		out.push(info.os);
	}
	if (isValidString(info.device)) {
		if (isBrowserAvailable || isOSAvailable) {
			out.push(`(${info.device})`);
		} else {
			out.push(info.device);
		}
	}

	return out.join(" ");
}
