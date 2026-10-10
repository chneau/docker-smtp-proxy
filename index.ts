import { timingSafeEqual } from "node:crypto";
import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import { type ErrorHandler, Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import {
	describeRoute,
	openAPIRouteHandler,
	resolver,
	validator,
} from "hono-openapi";
import { createTransport } from "nodemailer";
import { bodyType, responseType } from "./types";

const apiKey = Bun.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
console.log(`API_KEY: ${apiKey.slice(0, 4)}...`);

const apiKeyBuffer = Buffer.from(apiKey);

const isAuthorized = (providedKey: string | undefined): boolean => {
	if (!providedKey) return false;
	const providedBuffer = Buffer.from(providedKey);
	if (providedBuffer.length !== apiKeyBuffer.length) return false;
	return timingSafeEqual(providedBuffer, apiKeyBuffer);
};

const errorHandler: ErrorHandler = (err, c) => {
	console.log("=== Caught Error ===");
	if (err instanceof HTTPException) {
		return c.json({ message: err.message }, err.status);
	}
	console.error(err);
	return c.json({ message: err.message }, 500);
};

const app = new Hono()
	.onError(errorHandler)
	.use(logger((x) => x.startsWith("-") && console.log(x)))
	.use(etag())
	.use(timing({ crossOrigin: true }))
	.use(cors())
	.use(csrf())
	.use(trimTrailingSlash())
	.use(compress())
	.use(requestId())
	.get(
		"/healthz",
		describeRoute({
			description: "Healthcheck endpoint",
			summary: "Healthcheck",
			responses: {
				200: {
					description: "Service is healthy",
					content: {
						"application/json": {
							schema: resolver(responseType),
						},
					},
				},
			},
		}),
		(c) => c.json({ message: "ok" }),
	)
	.post(
		"/",
		describeRoute({
			description: "Send an email using the provided parameters",
			summary: "Send an email",
			parameters: [
				{
					name: "x-api-key",
					in: "header",
					required: true,
					description: "The API key",
					schema: { type: "string" },
				},
			],
			responses: {
				200: {
					description: "Successful response",
					content: {
						"application/json": { schema: resolver(responseType) },
					},
				},
				401: {
					description: "Unauthorized",
				},
			},
		}),
		validator("json", bodyType),
		async (c) => {
			if (!isAuthorized(c.req.header("x-api-key"))) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}
			const body = c.req.valid("json");
			console.log({
				...body,
				auth: body.auth ? { user: body.auth.user, pass: "***" } : undefined,
				attachments: undefined,
				attachmentsCount: body.attachments?.length,
			});
			const transporter = createTransport({
				host: body.host,
				port: body.port ?? 25,
				secure: body.secure ?? false,
				auth: body.auth,
			});
			const result = await transporter.sendMail({
				from: body.from,
				to: body.to,
				cc: body.cc,
				bcc: body.bcc,
				replyTo: body.replyTo,
				subject: body.subject,
				text: body.text,
				html: body.html,
				attachments: body.attachments?.map((x) => ({
					...x,
					encoding: x.encoding ?? "base64",
				})),
			});
			return c.json({ message: "ok", json: result });
		},
	)
	.get("/swagger", swaggerUI({ url: "/doc" }))
	.get("/scalar", Scalar({ url: "/doc" }));

app.get(
	"/doc",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "SMTP Proxy API",
				version: "1.0.0",
				description: "HTTP to SMTP Proxy Service",
			},
			servers: [
				{
					url: "http://localhost:3000",
					description: "Local server",
				},
			],
		},
	}),
);

showRoutes(app);

export default app;
export type ServerType = typeof app;
