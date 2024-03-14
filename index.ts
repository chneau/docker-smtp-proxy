import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@grotto/logysia";
import { Elysia, t } from "elysia";
import { createTransport } from "nodemailer";

const port = Number.parseInt(process.env.PORT || "3000", 10);
console.log(`PORT: ${port}`);
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
console.log(`API_KEY: ${apiKey.slice(0, 4)}...`);

const r = new Elysia();
r.use(logger({ logIP: true }));
r.use(swagger());
r.use(serverTiming());

const allowedPrioritiesType = [
	t.Literal("high"),
	t.Literal("normal"),
	t.Literal("low"),
];

const evenlopeType = t.Object({
	from: t.Union([t.String(), t.Literal(false)]),
	to: t.Array(t.String()),
});

const addressesType = t.Array(
	t.Union([t.String(), t.Object({ name: t.String(), address: t.String() })]),
);

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
			bcc: body.bcc,
			priority: body.priority,
			subject: body.subject,
			text: body.text,
			html: body.html,
			attachments: body.attachments?.map((x) => ({
				...x,
				encoding: x.encoding ?? "base64",
			})),
		});
		return result;
	},
	{
		headers: t.Object({
			"x-api-key": t.String(),
		}),
		response: {
			200: t.Object({
				envelope: evenlopeType,
				messageId: t.String(),
				accepted: addressesType,
				rejected: addressesType,
				pending: addressesType,
				response: t.String(),
			}),
			400: t.Object({
				name: t.String(),
				message: t.String(),
			}),
		},
		type: "application/json",
		body: t.Object({
			host: t.String(),
			port: t.Optional(t.Number({ default: 25 })),
			secure: t.Optional(t.Boolean({ default: false })),
			from: t.String(),
			to: t.String(),
			bcc: t.Optional(t.String()),
			priority: t.Optional(t.Union(allowedPrioritiesType)),
			subject: t.String(),
			text: t.Optional(t.String()),
			html: t.String(),
			attachments: t.Optional(
				t.Array(
					t.Object({
						filename: t.String(),
						content: t.String(),
						encoding: t.Optional(t.String({ default: "base64" })),
					}),
				),
			),
		}),
	},
);

const url = `http://localhost:${port}`;
console.log(`Server      : ${url}`);
console.log(`Swagger     : ${url}/swagger`);
console.log(`SwaggerJson : ${url}/swagger/json`);

r.listen(port);
