import { ApiEndPoints } from "$lib/generated/api-endpoints.js";
import { db, schema } from "$lib/server/db.js";
import { proxyEtRequest } from "$lib/server/etlab.js";
import { verifyNsToken } from "$lib/server/index.js";
import { redis } from "$lib/server/redis";
import { error, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import z from "zod";

// note regarding cache levels: L1 is Redis cache. L2 is DB cache.

// todo: write cron for clearing expired L2 entries every 24h

const BEARER_PREFIX = "Bearer ";
const ALLOWED_ENDPOINTS: string[] = [ApiEndPoints.SURVEY_URL, ApiEndPoints.RESULT_SEASONAL_URL];
const PROXY_REQUEST_SCHEMA = z
	.object({
		collegeId: z.int(),
		accountUsername: z.string().nonempty().max(64),
		endpoint: z.string().nonempty().max(128),
		method: z.enum(["GET", "POST"]),
		body: z.unknown().optional()
	})
	.strict();

const RATE_LIMIT_WINDOW_IN_S = 5 * 60;
const MAX_REQ_PER_WINDOW = 20;

export const POST = async (event) => {
	const authTokenHeader = event.request.headers.get("authorization");
	if (typeof authTokenHeader !== "string" || !authTokenHeader.startsWith(BEARER_PREFIX))
		return error(401);
	const authToken = authTokenHeader.slice(BEARER_PREFIX.length);
	const verified = await verifyNsToken(authToken);
	if (verified == null) return error(401); // todo: undo

	const key = `prl:${authToken}`;
	const [count] = await redis
		.pipeline()
		.incr(key)
		.expire(key, RATE_LIMIT_WINDOW_IN_S, "NX") // NX = only set if not exists
		.exec();
	if (count > MAX_REQ_PER_WINDOW) return error(429);

	const parsed = await event.request
		.json()
		.then((data) => PROXY_REQUEST_SCHEMA.parse(data))
		.catch(() => error(400));

	if (!ALLOWED_ENDPOINTS.includes(parsed.endpoint)) return error(400);

	const notificationServerSettings = await db.query.notificationServerSettings.findFirst({
		where: and(
			eq(schema.notificationServerSettings.collegeId, parsed.collegeId),
			eq(schema.notificationServerSettings.accountUsername, parsed.accountUsername),
			eq(schema.notificationServerSettings.authToken, authToken)
		),
		columns: {
			etlabAccessToken: true
		},
		with: {
			account: {
				columns: {},
				with: {
					college: {
						columns: {
							baseUrl: true
						}
					}
				}
			}
		}
	});
	if (notificationServerSettings == null) return error(401);

	const proxyResponse = await proxyEtRequest(
		{
			collegeBaseUrl: notificationServerSettings.account.college.baseUrl,
			collegeId: parsed.collegeId,
			username: parsed.accountUsername
		},
		notificationServerSettings.etlabAccessToken,
		{
			endpoint: parsed.endpoint,
			method: parsed.method,
			body: parsed.body
		}
	);

	if (proxyResponse.ok) {
		return json(
			{
				cacheStatus: proxyResponse.cacheStatus,
				fetchedAt: proxyResponse.fetchedAt,
				data: proxyResponse.data
			},
			{ status: 200, headers: { "Cache-Control": "max-age=60" } }
		);
	} else {
		console.error(proxyResponse.message);
		return error(proxyResponse.statusCode, proxyResponse.message);
	}
};
