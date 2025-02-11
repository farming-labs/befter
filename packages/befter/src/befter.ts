import { parallelCallerFunc, serialCallerFunc } from "./helper";
import {
	type BaseBefterState,
	ExtractKey,
	type HookKeys,
	InferCb,
	type InferInterceptCallback,
	Intercept,
	type InterceptCb,
} from "./types";

type InferSpyEvent<HT extends Record<string, any>> = {
	[key in keyof HT]: {
		name: key;
		args: Parameters<HT[key]>;
		context: Record<string, any>;
	};
}[keyof HT];
type hookFunctionRunner = "serial" | "parallel";
type AnyObject<V extends string> = Record<V, any>;
type InterceptorCb = {};
type oneHookState = { [key: string]: InterceptCb[] };
export function createBefter<
	HooksT extends Record<string, any>,
>(): BaseBefterState<HooksT> {
	return {
		hooks: {
			after: [],
			before: [],
		},
	};
}
export function hook<
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
		afterRunner?: hookFunctionRunner;
		beforeRunner?: hookFunctionRunner;
		runner?: hookFunctionRunner;
	} = {
		allowDeprecated: false,
		afterRunner: "serial",
		beforeRunner: "serial",
		runner: "serial",
	},
): {
	currHook: oneHookState;
	beforeMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
	afterMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
	removeHook: (
		state: BaseBefterState<HooksT>,
		name: HookKeys<HooksT>,
		function_: InferInterceptCallback<HooksT, NameT>,
	) => void;
} {
	const { hooks } = state;
	hooks[`${name}`] = hooks[`${name}`] || [];
	if (Array.isArray(function_)) {
		hooks[name].push(...function_);
	} else {
		hooks[name].push(function_);
	}

	const { before, after } = hooks;

	const beforeMetas = (
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void] => {
		const addBefores = (cb: InterceptCb | InterceptCb[]) => {
			if (Array.isArray(cb)) {
				before.push(...cb);
			} else {
				before.push(cb);
			}
		};
		return [before, addBefores];
	};

	const afterMetas = (
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void] => {
		options.afterRunner = option.runner;
		const addAfters = (cb: InterceptCb | InterceptCb[]) => {
			if (Array.isArray(cb)) {
				after.push(...cb);
			} else {
				after.push(cb);
			}
		};
		return [after, addAfters];
	};

	return {
		currHook: { [name]: hooks[name] },
		beforeMeta: beforeMetas,
		afterMeta: afterMetas,
		removeHook: (
			state: BaseBefterState<HooksT>,
			name: HookKeys<HooksT>,
			function_: InferInterceptCallback<HooksT, NameT>,
		) => removeHook(state, name, function_),
	};
}
export const callHookFromState = (state: oneHookState) => {};

export function hookBefore<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: string,
	function_: InferInterceptCallback<HooksT, NameT>,
	options: { allowDeprecated?: boolean } = {},
): [InterceptCb[], () => void] {
	let {
		hooks: { before },
	} = state;
	before?.push(function_);

	return [
		before!,
		() => {
			before = [];
		},
	];
}
export const updateHook = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_: InferInterceptCallback<HooksT, NameT>,
	updatedFunction_: InferInterceptCallback<HooksT, NameT>,
): InterceptCb => {
	const { hooks } = state;
	const index = hooks[name].indexOf(function_);
	const updatedHook: InterceptCb = hooks[name][index];
	if (index !== -1) {
		hooks[name][index] = updatedFunction_;
	}
	return updatedHook;
};
export const removeHook = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_: InferInterceptCallback<HooksT, NameT>,
): InterceptCb => {
	const { hooks } = state;
	const index = hooks[name].indexOf(function_);
	const removedHook: InterceptCb = hooks[name][index];
	if (index !== -1) {
		hooks[name].splice(index, 1);
	}
	return removedHook;
};
export const removeHookItSelf = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): oneHookState | null => {
	const { hooks } = state;
	let removedHook: oneHookState | null = null;
	Object.keys(hooks).map((hk) => {
		if (hk === name) {
			removedHook = { [hk]: hooks[hk] };

			delete hooks[name];
		}
	});
	return removedHook;
};

export const getHookWithIndex = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	indx: number,
): { [name: string]: oneHookState[string][number] } | null => {
	const { hooks } = state;
	if (hooks.hasOwnProperty(name)) {
		const currHook = hooks[name];
		if (indx >= currHook.length) return null;
		return { [name]: currHook[indx] };
	} else {
		return null;
	}
};
export const getHook = <
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

export const callHook = async <
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

// export const getConfigs = async <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   hook: any,
// ): void => {
//   const { options } = hook;
//   return optiont s;
// };

// export const hook = <K extends AnyObject<string>>() => {
//   const intercepts: Intercept = {};
//   const befInterceptor: InterceptorCb[] = [];
//   const aftInterceptor: InterceptorCb[] = [];

//   const inctercept = <N extends ExtractKey<K>>(
//     interceptName: N,
//     fn: InferCb<K, N>,
//     opt?: { allow?: boolean },
//   ) => {
//     if (typeof fn != "function" || !interceptName) {
//       return () => {};
//     }

//     if (!fn.name) {
//       try {
//         Object.defineProperty(fn, "name", {
//           get: () => "_" + name.replace(/\W+/g, "_") + "_interceptor_cb",
//           configurable: true,
//         });
//       } catch {}
//     }
//     if (intercepts[name] === undefined) {
//       intercepts[name] = [];
//     }
//     intercepts[name].push(fn);
//   };
// };
