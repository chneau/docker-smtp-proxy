import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@grotto/logysia";
import { Elysia, t } from "elysia";
import { compression } from "elysia-compression";
import { createTransport } from "nodemailer";
import { bodyType, errorType, headersType, responseType } from "./types";

const port = Number.parseInt(process.env.PORT || "3000", 10);
console.log(`PORT: ${port}`);
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
console.log(`API_KEY: ${apiKey.slice(0, 4)}...`);

const r = new Elysia();
r.use(logger({ logIP: true }));
r.use(swagger());
r.use(compression());
r.use(serverTiming());

r.post(
	"/",
	async ({ body, headers }) => {
		if (headers["x-api-key"] !== apiKey) throw new Error("Unauthorized");
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
