import EmptyBox from "./empty-box.svelte";
import LoadingBox from "./loading-box.svelte";
import ErrorBox from "./error-box.svelte";

export { EmptyBox as Empty, ErrorBox as Error, LoadingBox as Loading };
export default {
	Empty: EmptyBox,
	Error: ErrorBox,
	Loading: LoadingBox
};
