import { t } from "elysia";

export const responseType = t.Object({
	message: t.String({ description: "The message" }),
	json: t.Optional(t.Any({ description: "The JSON" })),
});

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
		replyTo: t.Optional(t.String({ description: "Reply To" })),
		cc: t.Optional(t.String({ description: "The CC" })),
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
