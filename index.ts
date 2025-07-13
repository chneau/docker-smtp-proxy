import "./fixCompression";
import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import type { Serve } from "bun";
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
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { createTransport } from "nodemailer";
import { bodyType, responseType } from "./types";

const apiKey = Bun.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
console.log(`API_KEY: ${apiKey.slice(0, 4)}...`);

const errorHandler: ErrorHandler = (err, c) => {
	console.log("=== Caught Error ===");
	if (err instanceof HTTPException) {
		return c.text(err.message, err.status);
	}
	console.error(err);
	return c.text(err.message, 500);
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
	.post(
		"/",
		describeRoute({
			description: "Send an email using the provided parameters",
			summary: "Send an email",
			responses: {
				200: {
					description: "Successful response",
					content: {
						"application/json": { schema: resolver(responseType) },
					},
				},
			},
		}),
		zValidator("json", bodyType),
		async (c) => {
			if (c.req.header("x-api-key") !== apiKey) {
				throw new Error("Unauthorized");
			}
			const body = c.req.valid("json");
			console.log({
				...body,
				attachments: undefined,
				attachmentsCount: body.attachments?.length,
			});
			const transporter = createTransport({
				host: body.host,
				port: body.port ?? 25,
				secure: body.secure ?? false,
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
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Hono",
				version: "1.0.0",
				description: "API for greeting users",
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

export default app satisfies Serve;
export type ServerType = typeof app;
