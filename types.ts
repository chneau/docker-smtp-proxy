import { z } from "zod";

export const responseType = z.object({
	message: z.string().describe("The message"),
	json: z.any().optional().describe("The JSON"),
});

export const bodyType = z
	.object({
		host: z.string().describe("The host"),
		port: z.number().default(25).describe("The port").optional(),
		secure: z.boolean().default(false).describe("Secure").optional(),
		from: z.string().describe("The FROM"),
		to: z.string().describe("The TO"),
		replyTo: z.string().describe("Reply To").optional(),
		cc: z.string().describe("The CC").optional(),
		bcc: z.string().describe("The BCC").optional(),
		subject: z.string().describe("The subject"),
		text: z.string().describe("The text content").optional(),
		html: z.string().describe("The HTML content"),
		attachments: z
			.array(
				z
					.object({
						filename: z.string().describe("The filename"),
						content: z.string().describe("The content"),
						encoding: z
							.string()
							.default("base64")
							.describe("The encoding")
							.optional(),
					})
					.describe("The attachment"),
			)
			.optional(),
	})
	.describe("The email parameters")
	.catchall(z.unknown());

export const headersType = z
	.object({
		"x-api-key": z.string().describe("The API key"),
	})
	.describe("The headers");
