import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { compression } from "elysia-compression";
import { createTransport } from "nodemailer";
import { bodyType, errorType, headersType, responseType } from "./types";

const port = Number.parseInt(Bun.env.PORT || "3000", 10);
console.log(`PORT: ${port}`);
const apiKey = Bun.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
console.log(`API_KEY: ${apiKey.slice(0, 4)}...`);
const logging = (Bun.env.LOGGING ?? "true") === "true";
console.log(`LOGGING: ${logging}`);

const r = new Elysia();
r.use(swagger());
r.use(compression());
r.use(serverTiming());

r.post(
	"/",
	async ({ body, headers }) => {
		if (headers["x-api-key"] !== apiKey) throw new Error("Unauthorized");
		if (logging) {
			console.log({
				...body,
				attachments: undefined,
				attachmentsCount: body.attachments?.length,
			});
		}
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
		return { message: "ok", json: result };
	},
	{
		headers: headersType,
		response: { 200: responseType, 400: errorType },
		type: "application/json",
		body: bodyType,
		detail: {
			summary: "Send an email",
			description: "Send an email using the provided parameters",
		},
	},
);

const url = `http://localhost:${port}`;
console.log(`Server      : ${url}`);
console.log(`Swagger     : ${url}/swagger`);
console.log(`SwaggerJson : ${url}/swagger/json`);

r.listen(port);
