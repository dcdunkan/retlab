import {
	bearer,
	DAY,
	hexSha256,
	normalizeJson,
	parseServerDateString,
	PROXY_RESPONSE_CACHE_STATUS
} from "$lib";
import type { assignment } from "$lib/generated/models";
import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { redis } from "./redis";

export function parseAssignmentsResponse(
	response: assignment.AssignmentResponse,
	collegeBaseUrlOrigin: string
) {
	return response.assignments.map((assignment) => {
		const hasUploaded =
			assignment.uploaded_file !== "" && assignment.uploaded_file !== collegeBaseUrlOrigin;
		const isDue = assignment.can_submit && (!assignment.upload || !hasUploaded);

		// const issueDate = parseServerDateString(assignment.issue_date);
		// const lastDate = parseServerDateString(assignment.last_date);

		return {
			...assignment,
			// todo: parse subject to code & name
			_parsed: {
				issue_date: parseServerDateString(assignment.issue_date),
				last_date: parseServerDateString(assignment.last_date),
				has_uploaded: hasUploaded,
				is_due: !!isDue
			}
		};
	});
}

const FRESH_CACHE_EXPIRY_IN_S = 60;
const STALE_CACHE_EXPIRY = 14 * DAY;

type ProxySuccess<T> = {
	ok: true;
	cacheStatus: (typeof PROXY_RESPONSE_CACHE_STATUS)[keyof typeof PROXY_RESPONSE_CACHE_STATUS];
	fetchedAt: number;
	data: T;
};
type ProxyError = {
	ok: false;
	message: string;
	statusCode: number;
};

export async function proxyEtRequest<T>(
	user: {
		collegeId: number;
		username: string;
		collegeBaseUrl: string;
	},
	etlabAccessToken: string,
	req: {
		method: "GET" | "POST";
		endpoint: string;
		body?: unknown;
	}
): Promise<ProxySuccess<T> | ProxyError> {
	const now = Date.now();
	const cacheKey = await hexSha256(
		JSON.stringify({
			c: user.collegeId,
			u: user.username,
			e: req.endpoint,
			...(req.body != null ? { b: normalizeJson(req.body) } : {})
		})
	);

	// check inside fresh cache
	const cached = await redis.get<{ data: T; fetchedAt: number }>(`pc:${cacheKey}`);
	if (cached != null) {
		return {
			ok: true,
			cacheStatus: PROXY_RESPONSE_CACHE_STATUS.Cached,
			fetchedAt: cached.fetchedAt,
			data: cached.data
		};
	}

	const response = await fetch(user.collegeBaseUrl + req.endpoint, {
		headers: { Authorization: bearer(etlabAccessToken) },
		method: req.method,
		...(req.method !== "GET" && req.body != null ? { body: JSON.stringify(req.body) } : {})
	});

	if (response.status === 400 || response.status === 401 || response.status === 403) {
		return {
			ok: false,
			statusCode: response.status,
			message: "Etlab request failed with status: " + response.status
		};
	}

	let parsedJson = null;
	try {
		const jsonData = await response.json();
		if (jsonData.login === false) {
			// if the request was unauthenticated, its not a good idea to let the contents to be exposed to the ns
			return {
				ok: false,
				statusCode: 401,
				message: "Etlab response indicates the user is unauthorized"
			};
		}
		// todo: better throwing and logging
		if (jsonData.success === false) throw 1; // if for some damn reason
		if (typeof jsonData.error === "string" && jsonData.error !== "") throw 1; // if any error messages are present
		parsedJson = jsonData;
	} catch {
		// ignore
	}

	if (response.ok && parsedJson != null) {
		// store in both caches and then return the result
		await redis.set(
			`pc:${cacheKey}`,
			{ data: parsedJson, fetchedAt: now },
			{ ex: FRESH_CACHE_EXPIRY_IN_S }
		);
		const updatedData = {
			cachedAt: new Date(now),
			data: parsedJson
		};

		waitUntil(
			db
				.insert(schema.staleProxyCache)
				.values({
					key: cacheKey,
					...updatedData
				})
				.onConflictDoUpdate({
					target: [schema.staleProxyCache.key],
					set: updatedData
				})
				.catch(console.error)
		);

		return {
			ok: true,
			cacheStatus: PROXY_RESPONSE_CACHE_STATUS.Fresh,
			fetchedAt: now,
			data: parsedJson
		};
	} else {
		const cached = await db.query.staleProxyCache.findFirst({
			where: eq(schema.staleProxyCache.key, cacheKey)
		});
		if (cached != null) {
			if (cached.cachedAt.getTime() + STALE_CACHE_EXPIRY >= now) {
				return {
					ok: true,
					cacheStatus: PROXY_RESPONSE_CACHE_STATUS.Stale,
					fetchedAt: cached.cachedAt.getTime(),
					data: cached.data as T
				};
			}
			await db
				.delete(schema.staleProxyCache)
				.where(eq(schema.staleProxyCache.key, cacheKey))
				.catch(console.error);
		}
		// no cached data in L2 either, error
	}

	return {
		ok: false,
		statusCode: 500,
		message: "Failed to make proxy call to Etlab"
	};
}
