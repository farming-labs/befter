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
type Storage = { type: "local" | "redis"; url?: string; client?: any };
type hookFunctionRunner = "serial" | "parallel";
type oneHookState = { [key: string]: InterceptCb[] };
type IsRedisStorage<T> = T extends { storage: { type: "redis" } }
	? true
	: false;
type HookAtIndex = { [name: string]: OneHookState[string][number] };
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
}
type ReturnLocalHook<T, S extends keyof T> = {
	currHook: oneHookState;
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
	) => Promise<InterceptCb>;
};
// Create Befter state
export function createBefter<HooksT extends Record<string, any>>(options: {
	storage: {
		type: "local" | "redis";
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
			client: options.storage.client,
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
	options: HookOptions = {
		runner: "serial",
		storage: {
			type: "local",
		},
	},
) {
	if (isRedisStorage(state)) {
		return hookRedis(state, name, function_) as Promise<
			ReturnRedisHook<HooksT, NameT>
		>;
	} else {
		return hookLocal(state, name, function_) as Promise<
			ReturnLocalHook<HooksT, NameT>
		>;
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
	if (isRedisStorage(state)) {
		await callRedisHook(state, name);
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
	if (isRedisStorage(state)) {
		return updateRedisHook(state, name, oldFunction, newFunction);
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
	if (isRedisStorage(state)) {
		return removeRedisHook(state, name, function_) as Promise<InterceptCb>;
	} else {
		return removeLocalHook(state, name, function_) as InterceptCb;
	}
}

// Remove all hooks for a specific name
export function removeHookItself<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): OneHookState | null | Promise<OneHookState> {
	if (isRedisStorage(state)) {
		return removeRedisHookItself(state, name) as Promise<OneHookState> | null;
	} else {
		return removeLocalHookItself(state, name) as OneHookState | null;
	}
}
// getHook by its name
export const getHook = <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
): oneHookState | Promise<oneHookState> => {
	if (state.storage.type === "redis" && state.storage.url) {
		return getRedisHook(state, name) as Promise<oneHookState>;
	} else {
		return getLocalHook(state, name) as oneHookState;
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
): HookAtIndex | Promise<HookAtIndex> {
	if (state.storage.type === "redis" && state.storage.url) {
		return getRedisHookWithIndex(state, name, index) as Promise<HookAtIndex>;
	} else {
		return getLocalHookWithIndex(state, name, index) as HookAtIndex;
	}
}
