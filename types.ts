import { ModelToYup } from "@sinclair/typebox-codegen";
import { t } from "elysia";

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

export const responseType = t.Object(
	{
		envelope: {
			...evenlopeType,
			description:
				"The envelope information. This is the information that is used to generate the Message-Id and Received headers.",
		},
		messageId: t.String({ description: "The unique message identifier" }),
		accepted: {
			...addressesType,
			description: "An array of addresses that were accepted for delivery",
		},
		rejected: {
			...addressesType,
			description: "An array of addresses that were rejected for delivery",
		},
		pending: t.Optional({
			...addressesType,
			description: "An array of addresses that were temporarily rejected",
		}),
		response: t.String({
			description: "The last SMTP response from the server",
		}),
	},
	{
		description: "The email was sent successfully",
		additionalProperties: true,
	},
);

export const errorType = t.Object(
	{
		name: t.String({ description: "The error name" }),
		message: t.String({ description: "The error message" }),
	},
	{ description: "Bad Request" },
);

export const bodyType = t.Object(
	{
		host: t.String({ description: "The host" }),
		port: t.Optional(t.Number({ default: 25, description: "The port" })),
		secure: t.Optional(t.Boolean({ default: false, description: "Secure" })),
		from: t.String({ description: "The FROM" }),
		to: t.String({ description: "The TO" }),
		bcc: t.Optional(t.String({ description: "The BCC" })),
		subject: t.String({ description: "The subject" }),
		text: t.Optional(t.String({ description: "The text content" })),
		html: t.String({ description: "The HTML content" }),
		attachments: t.Optional(
			t.Array(
				t.Object(
					{
						filename: t.String({ description: "The filename" }),
						content: t.String({ description: "The content" }),
						encoding: t.Optional(
							t.String({ default: "base64", description: "The encoding" }),
						),
					},
					{ description: "The attachment" },
				),
			),
		),
	},
	{ description: "The email parameters" },
);

export const headersType = t.Object(
	{
		"x-api-key": t.String({ description: "The API key" }),
	},
	{ description: "The headers" },
);
