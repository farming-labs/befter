import { serialCallerFunc, parallelCallerFunc } from "../helper";
import {
	BaseBefterState,
	HookKeys,
	InferInterceptCallback,
	InterceptCb,
	oneHookState,
} from "../types";

export function hookLocal<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_:
		| InferInterceptCallback<HooksT, NameT>
		| InferInterceptCallback<HooksT, NameT>[],
	options: {
		allowDeprecated?: boolean;
		afterRunner?: "serial" | "parallel";
		beforeRunner?: "serial" | "parallel";
		runner?: "serial" | "parallel";
	} = {
		allowDeprecated: false,
		afterRunner: "serial",
		beforeRunner: "serial",
		runner: "serial",
	},
): Promise<{
	currHook: { [key: string]: InterceptCb[] };
	beforeMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [
		() => Promise<InterceptCb[]>,
		(cb: InterceptCb | InterceptCb[]) => void,
	];
	afterMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [
		() => Promise<InterceptCb[]>,
		(cb: InterceptCb | InterceptCb[]) => void,
	];
	removeHook: (
		state: BaseBefterState<HooksT>,
		name: HookKeys<HooksT>,
		function_: InferInterceptCallback<HooksT, NameT>,
	) => void;
}> {
	state.hooks[name] = state.hooks[name] || [];

	if (Array.isArray(function_)) {
		state.hooks[name].push(...function_);
	} else {
		state.hooks[name].push(function_);
	}

	const { before, after } = state.hooks;

	const beforeMetas = (
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): [
		() => Promise<InterceptCb[]>,
		(cb: InterceptCb | InterceptCb[]) => void,
	] => {
		const addBefores = (cb: InterceptCb | InterceptCb[]) => {
			if (Array.isArray(cb)) {
				before.push(...cb);
			} else {
				before.push(cb);
			}
		};
		const func = () => Promise.resolve(before);
		return [func, addBefores];
	};

	const afterMetas = (
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): [
		() => Promise<InterceptCb[]>,
		(cb: InterceptCb | InterceptCb[]) => void,
	] => {
		options.afterRunner = option.runner;
		const addAfters = (cb: InterceptCb | InterceptCb[]) => {
			if (Array.isArray(cb)) {
				after.push(...cb);
			} else {
				after.push(cb);
			}
		};

		const func = () => Promise.resolve(after);
		return [func, addAfters];
	};

	return Promise.resolve({
		currHook: { [name]: state.hooks[name] },
		beforeMeta: beforeMetas,
		afterMeta: afterMetas,
		removeHook: (state, name, function_) =>
			removeLocalHook(state, name, function_),
	});
}

// Call Hook from Local Storage
// export async function callLocalHook<
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(state: BaseBefterState<HooksT>, name: NameT): Promise<void> {
//   if (!state.hooks[name]) return;
//   for (const hook of state.hooks[name]) {
//     await hook();
//   }
// }

// Remove a specific Hook from Local Storage
export function removeLocalHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_: InferInterceptCallback<HooksT, NameT>,
): InterceptCb {
	const index = state.hooks[name]?.indexOf(function_);
	if (index !== undefined && index !== -1) {
		return state.hooks[name].splice(index, 1)[0];
	} else {
		throw new Error("[BEFTER]: Hook not found in local storage");
	}
}

// Remove all Hooks for a specific name in Local Storage
export function removeLocalHookItself<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): { [key: string]: InterceptCb[] } | null {
	if (!(name in state.hooks)) {
		return null;
	}
	const removed = state.hooks[name];
	delete state.hooks[name];
	return { [name]: removed };
}

// Update Hook in Local Storage
export function updateLocalHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	oldFunction: InferInterceptCallback<HooksT, NameT>,
	newFunction: InferInterceptCallback<HooksT, NameT>,
): InterceptCb {
	const index = state.hooks[name]?.indexOf(oldFunction);
	if (index !== undefined && index !== -1) {
		state.hooks[name][index] = newFunction;
		return newFunction;
	} else {
		throw new Error("[BEFTER]: Hook not found in local storage");
	}
}

// Get Hook by Index in Local Storage
export function getLocalHookWithIndex<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	index: number,
): { [name: string]: InterceptCb } | null {
	if (!state.hooks[name] || index >= state.hooks[name].length) return null;
	return { [name]: state.hooks[name][index] };
}

export const getLocalHook = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): oneHookState | null => {
	const { hooks } = state;
	if (hooks.hasOwnProperty(name)) {
		return { [name]: hooks[name] };
	} else {
		return null;
	}
};

export const callLocalHook = async <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	option: {
		runner: "serial" | "parallel";
	} = { runner: "serial" },
): Promise<void> => {
	const { hooks } = state;
	if (option?.runner === "serial") {
		await serialCallerFunc(state, name);
	} else {
		await parallelCallerFunc(state, name);
	}
};

export const getConfigs = async <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	hook: any,
) => {
	const { options } = hook;
	return options;
};
