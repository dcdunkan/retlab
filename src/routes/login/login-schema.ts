import z from "zod";
export const loginSchema = z
	.object({
		collegeId: z.coerce.number<string>({
			error: "You must choose an insitution"
		}),
		username: z.string().nonempty({
			error: "Invalid username"
		}),
		password: z.string().nonempty({
			error: "Password is empty!"
		})
	})
	.strict();
