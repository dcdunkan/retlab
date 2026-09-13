import { zodStrictNumber } from "$lib";
import z from "zod";

export const loginSchema = z
	.object({
		collegeId: zodStrictNumber(
			z.number("Invalid college").int("Invalid college"),
			"Invalid college"
		),
		username: z.string("Invalid username").nonempty("Username is empty!").max(128, "Too long!"),
		password: z.string("Invalid password").nonempty("Password is empty!").max(256, "Too long!"),
		action: z.enum(["login"]) // todo: bruhh... get rid of this once proper docs are released
	})
	.strict();
