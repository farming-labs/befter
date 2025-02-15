import { ReturnRedisHook } from "../befter";
import {
	BaseBefterState,
	HookKeys,
	InferInterceptCallback,
	InterceptCb,
	oneHookState,
} from "../types";

// Hook with Redis Storage
export async function hookRedis<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_:
		| InferInterceptCallback<HooksT, NameT>
		| InferInterceptCallback<HooksT, NameT>[],
	redisClient: any,
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
): Promise<ReturnRedisHook<HooksT, NameT>> {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");

	const keyExists = await redisClient.get(name);
	const existingHookList = JSON.parse(keyExists);
	const existingHooks: string[] = keyExists ? JSON.parse(keyExists) : [];
	const newHooks = Array.isArray(function_) ? function_ : [function_];
	if (keyExists) {
		newHooks.push(existingHookList);
	}
	const stringifiedHooks = newHooks.map((fn) => fn.toString());
	stringifiedHooks.forEach((hook) => {
		if (!existingHooks.includes(hook)) {
			existingHooks.push(hook);
		}
	});

	await redisClient.set(name, JSON.stringify(existingHooks));

	const beforeMetas = async (
		hooks?: any,
		hookLabel?: string,
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): Promise<
		[
			() => Promise<InterceptCb[]>,
			(cb: InterceptCb | InterceptCb[]) => Promise<void>,
		]
	> => {
		const getBefores = async () => {
			const result = await redisClient.get(`befter:before:${name}`);
			return result
				? JSON.parse(result).map(
						(fnStr: string) => new Function(`return ${fnStr}`)() as InterceptCb,
					)
				: [];
		};

		const addBefores = async (cb: InterceptCb | InterceptCb[]) => {
			const cbs = Array.isArray(cb) ? cb : [cb];

			const existingBefores = await getBefores();

			const newBeforeStrings = cbs.map((fn) => fn.toString());

			newBeforeStrings.forEach((hookStr) => {
				if (!existingBefores.map((fn) => fn.toString()).includes(hookStr)) {
					existingBefores.push(new Function(`return ${hookStr}`)());
				}
			});

			await redisClient.set(
				`befter:before:${name}`,
				JSON.stringify(existingBefores.map((fn) => fn.toString())),
			);
		};
		const result = await getBefores();
		return [getBefores, addBefores];
	};

	const afterMetas = async (
		hooks?: any,
		hookLabel?: string,
		option: { runner: "serial" | "parallel" } = { runner: "serial" },
	): Promise<
		[
			() => Promise<InterceptCb[]>,
			(cb: InterceptCb | InterceptCb[]) => Promise<void>,
		]
	> => {
		const getAfters = async () => {
			const result = await redisClient.get(`befter:after:${name}`);
			return result
				? JSON.parse(result).map(
						(fnStr: string) => new Function(`return ${fnStr}`)() as InterceptCb,
					)
				: [];
		};

		const addAfters = async (cb: InterceptCb | InterceptCb[]) => {
			const cbs = Array.isArray(cb) ? cb : [cb];

			const existingBefores = await getAfters();

			const newBeforeStrings = cbs.map((fn) => fn.toString());

			newBeforeStrings.forEach((hookStr) => {
				if (!existingBefores.map((fn) => fn.toString()).includes(hookStr)) {
					existingBefores.push(new Function(`return ${hookStr}`)());
				}
			});

			await redisClient.set(
				`befter:after:${name}`,
				JSON.stringify(existingBefores.map((fn) => fn.toString())),
			);
		};
		const result = await getAfters();
		return [getAfters, addAfters];
	};
	let currHooks = await redisClient.get(name);
	currHooks = JSON.parse(currHooks) as string[];
	return {
		currHook: { [name]: currHooks as string[] },
		beforeMeta: beforeMetas,
		afterMeta: afterMetas,
		removeHook: (
			state: BaseBefterState<HooksT>,
			name: HookKeys<HooksT>,
			function_: InferInterceptCallback<HooksT, NameT>,
			client?: any,
		) => removeRedisHook(state, name, function_, client),
	};
}

// Call Hook from Redis Storage
// export async function callRedisHook<
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   redisClient: any,
// ): Promise<void> {
//   const hooks = JSON.parse((await redisClient.get(name)) || "[]");
//   for (const hook of hooks) {
//     await hook();
//   }
// }

// Remove a specific Hook from Redis Storage
export async function removeRedisHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	function_: InferInterceptCallback<HooksT, NameT>,
	redisClient: any,
): Promise<InterceptCb> {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");
	const index = hooks.indexOf(function_);
	if (index !== -1) {
		hooks.splice(index, 1);
		await redisClient.set(name, JSON.stringify(hooks));
		return eval(function_);
	} else {
		throw new Error("[BEFTER]: Hook not found in Redis storage");
	}
}

// Remove all Hooks for a specific name in Redis Storage
export async function removeRedisHookItself<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(state: BaseBefterState<HooksT>, name: NameT, redisClient: any) {
	const getHook = await redisClient.get(name);
	if (!getHook) {
		return null;
	}
	const parsedHook = JSON.parse(getHook);
	await redisClient.del(name);
	return { [name]: parsedHook };
}

// Update Hook in Redis Storage
export async function updateRedisHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	oldFunction: InferInterceptCallback<HooksT, NameT>,
	newFunction: InferInterceptCallback<HooksT, NameT>,
	redisClient: any,
): Promise<InterceptCb> {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");
	const stringfiedOldFunc = oldFunction.toString();
	const index = hooks.indexOf(stringfiedOldFunc);
	if (index !== -1) {
		hooks[index] = newFunction.toString().replace(/\s/g, "");
		await redisClient.set(name, JSON.stringify(hooks));
		return newFunction;
	} else {
		throw new Error("[BEFTER]: Hook not found in Redis storage");
	}
}

// Get Hook by Index in Redis Storage
export async function getRedisHookWithIndex<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	index: number,
	redisClient: any,
): Promise<{ [name: string]: InterceptCb } | null> {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");
	if (!hooks || index >= hooks.length) return null;
	return { [name]: eval(hooks[index]) };
}

// Get Hook from Redis Storage
export async function getRedisHook<
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	redisClient: any,
): Promise<oneHookState | null> {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");
	return hooks.length > 0 ? { [name]: hooks } : null;
}

export const callRedisHook = async <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	state: BaseBefterState<HooksT>,
	name: NameT,
	redisClient: any,
	option: {
		runner: "serial" | "parallel";
	} = { runner: "serial" },
): Promise<void> => {
	const hooks = JSON.parse((await redisClient.get(name)) || "[]");
	const befores = JSON.parse(await redisClient.get(`befter:before:${name}`));
	const afters = JSON.parse(await redisClient.get(`befter:after:${name}`));
	if (befores) {
		for (const hook of befores) {
			console.log({ hook });
			const evaledFunc = eval(hook);
			await evaledFunc();
		}
	}
	if (option?.runner === "serial") {
		for (const hook of hooks) {
			const evaledFunc = eval(hook);
			await evaledFunc();
		}
	} else {
		await Promise.all(hooks.map((hook: any) => eval(JSON.parse(hook))()));
	}
	if (afters) {
		for (const hook of afters) {
			const evaledFunc = eval(hook);
			await evaledFunc();
		}
	}
};

// Get Configs from Redis
export const getRedisConfigs = async <
	HooksT extends Record<string, any>,
	NameT extends HookKeys<HooksT>,
>(
	hook: any,
	redisClient: any,
) => {
	const { options } = hook;
	return options;
};
