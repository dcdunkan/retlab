import ky from "ky";

export const api = ky.extend({
	throwHttpErrors: false
});
