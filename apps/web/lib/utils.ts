import { callHook, createBefter, hook } from "@farming-labs/befter";
const hooks = createBefter({
	storage: {
		type: "local",
	},
});
export async function getStatus() {
	const {
		currHook: hookLists,
		afterMeta: af,
		beforeMeta: bf,
	} = hook(hooks, "hook1", () => {
		console.log("Excuting the main hook.");
	});
	const [currBf, addBf] = bf({ runner: "serial" });
	const func1 = () => {
		console.log("Do the preprocessing 1.");
	};
	const func2 = () => {
		console.log("Do the preprocessing 2.");
	};
	addBf([func1, func2]);

	const [currAf, addAf] = af();
	addAf(() => {
		console.log("Do the postprocessing.");
	});
	await callHook(hooks, "hook1");
	return { status: "ok" };
}
