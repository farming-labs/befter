import {
	type BaseBefterState,
	type HookKeys,
	type InferInterceptCallback,
	type InterceptCb,
} from "./types";

type InferSpyEvent<HT extends Record<string, any>> = {
	[key in keyof HT]: {
		name: key;
		args: Parameters<HT[key]>;
		context: Record<string, any>;
	};
}[keyof HT];
type Storage = "local" | "redis";
type hookFunctionRunner = "serial" | "parallel";
type AnyObject<V extends string> = Record<V, any>;
type InterceptorCb = {};
type oneHookState = { [key: string]: InterceptCb[] };
import {
	removeLocalHook,
	updateLocalHook,
	callLocalHook,
	getLocalHookWithIndex,
	removeLocalHookItself,
	hookLocal,
	getLocalHook,
} from "./storage/local";
import {
	getRedisHook,
	removeRedisHook,
	updateRedisHook,
	callRedisHook,
	getRedisHookWithIndex,
	removeRedisHookItself,
	hookRedis,
} from "./storage/redis";
type HookFunctionRunner = "serial" | "parallel";
type OneHookState = { [key: string]: InterceptCb[] };
interface HookOptions {
	allowDeprecated?: boolean;
	afterRunner?: HookFunctionRunner;
	beforeRunner?: HookFunctionRunner;
	runner?: HookFunctionRunner;
	storage?: Storage;
	redisUrl?: string;
}
type ReturnLocalHook<T, S extends keyof T> = {
	currHook: oneHookState;
	beforeMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
	afterMeta: (option?: {
		runner: "serial" | "parallel";
	}) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
	removeHook: (
		state: BaseBefterState<T>,
		name: HookKeys<T>,
		function_: InferInterceptCallback<T, S>,
	) => void;
};

function isRedisStorage<HooksT>(
	state: BaseBefterState<HooksT>,
): state is BaseBefterState<HooksT> & {
	storage: { type: "redis"; url: string };
} {
	return (
		state.storage.type === "redis" && typeof state.storage.url === "string"
	);
}
export type ReturnRedisHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
> = {
	currHook: { [x: string]: string[] };
	beforeMeta: (
		hooks?: any,
		hookLabel?: string,
		option?: { runner: "serial" | "parallel" },
	) => Promise<
		[
			() => Promise<InterceptCb[]>,
			(cb: InterceptCb | InterceptCb[]) => Promise<void>,
		]
	>;
	afterMeta: (
		hooks?: any,
		hookLabel?: string,
		option?: { runner: "serial" | "parallel" },
	) => Promise<
		[
			() => Promise<InterceptCb[]>,
			(cb: InterceptCb | InterceptCb[]) => Promise<void>,
		]
	>;
	removeHook: (
		state: BaseBefterState<HooksT>,
		name: HookKeys<HooksT>,
		function_: InferInterceptCallback<HooksT, NameT>,
		client?: any,
	) => Promise<InterceptCb>;
};
// Create Befter state
export function createBefter<HooksT extends Record<string, any>>(options: {
	storage: {
		type: Storage;
		url?: string;
		client?: any;
	};
	url?: string;
}): BaseBefterState<HooksT> {
	return {
		hooks: {
			after: [],
			before: [],
		},
		storage: {
			type: options.storage.type,
			url: options.storage.url,
		},
	};
}

// Register Hook
export function hook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_:
		| InferInterceptCallback<HooksT, NameT>
		| InferInterceptCallback<HooksT, NameT>[],
	options: HookOptions = { runner: "serial", storage: "local" },
): ReturnLocalHook<HooksT, NameT> | Promise<ReturnRedisHook<HooksT, NameT>> {
	if (isRedisStorage(state)) {
		return hookRedis(state, name, function_, state.storage.url) as Promise<
			ReturnRedisHook<HooksT, NameT>
		>;
	} else {
		return hookLocal(state, name, function_) as ReturnLocalHook<HooksT, NameT>;
	}
}

// Call Hook
export async function callHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	option: { runner: HookFunctionRunner } = { runner: "serial" },
): Promise<void> {
	if (state.storage.type === "redis" && state.storage.url) {
		await callRedisHook(state, name, state.storage.url);
	} else {
		await callLocalHook(state, name);
	}
}

// Update Hook
export function updateHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	oldFunction: InferInterceptCallback<HooksT, NameT>,
	newFunction: InferInterceptCallback<HooksT, NameT>,
): InterceptCb | Promise<InterceptCb> {
	if (state.storage.type === "redis" && state.storage.url) {
		return updateRedisHook(
			state,
			name,
			oldFunction,
			newFunction,
			state.storage.url,
		);
	} else {
		return updateLocalHook(state, name, oldFunction, newFunction);
	}
}

// Remove a specific hook
export function removeHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_: InferInterceptCallback<HooksT, NameT>,
): InterceptCb | Promise<InterceptCb> {
	if (state.storage.type === "redis" && state.storage.url) {
		return removeRedisHook(state, name, function_, state.storage.url);
	} else {
		return removeLocalHook(state, name, function_);
	}
}

// Remove all hooks for a specific name
export function removeHookItself<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): OneHookState | null | Promise<void> {
	if (state.storage.type === "redis" && state.storage.url) {
		return removeRedisHookItself(state, name, state.storage.url);
	} else {
		return removeLocalHookItself(state, name);
	}
}

export const getHook = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): oneHookState | Promise<oneHookState> => {
	if (state.storage.type === "redis" && state.storage.url) {
		return getRedisHook(state, name, state.storage.url);
	} else {
		return getLocalHook(state, name);
	}
};

// Get a hook by index
export function getHookWithIndex<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	index: number,
):
	| { [name: string]: OneHookState[string][number] }
	| Promise<{ [name: string]: OneHookState[string][number] }> {
	if (state.storage.type === "redis" && state.storage.url) {
		return getRedisHookWithIndex(state, name, index, state.storage.url);
	} else {
		return getLocalHookWithIndex(state, name, index);
	}
}
