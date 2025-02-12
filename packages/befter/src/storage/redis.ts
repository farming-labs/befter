import {
  BaseBefterState,
  HookKeys,
  InferInterceptCallback,
  InterceptCb,
  oneHookState,
} from "../types";

import { RedisClientType } from "redis";

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
) {
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
  const keyExistsLater = await redisClient.get(name);
  const beforeMetas = (
    hooks?: any,
    hookLabel?: string,
    option: { runner: "serial" | "parallel" } = { runner: "serial" },
  ): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => Promise<void>] => {
    const getBefores = async () => {
      const storedBefores = await redisClient.lRange(
        `befter:before:${hookLabel}`,
        0,
        -1,
      );
      return storedBefores.map(
        (fnStr) => new Function(`return ${fnStr}`)() as InterceptCb,
      );
    };

    const addBefores = async (cb: InterceptCb | InterceptCb[]) => {
      const cbs = Array.isArray(cb) ? cb : [cb];
      for (const fn of cbs) {
        await redisClient.rPush(`befter:before:${hookLabel}`, fn.toString());
      }
    };

    return [getBefores(), addBefores];
  };

  const afterMetas = (
    hooks?: any,
    hookLabel?: string,
    option: { runner: "serial" | "parallel" } = { runner: "serial" },
  ): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => Promise<void>] => {
    const getAfters = async () => {
      const storedAfters = await redisClient.lRange(
        `befter:after:${hookLabel}`,
        0,
        -1,
      );
      return storedAfters.map(
        (fnStr) => new Function(`return ${fnStr}`)() as InterceptCb,
      );
    };

    const addAfters = async (cb: InterceptCb | InterceptCb[]) => {
      const cbs = Array.isArray(cb) ? cb : [cb];
      for (const fn of cbs) {
        await redisClient.rPush(`befter:after:${hookLabel}`, fn.toString());
      }
    };

    return [getAfters(), addAfters];
  };
  let currHooks = await redisClient.get(name);
  currHooks = JSON.parse(currHooks) as string[];
  return {
    currHook: { [name]: currHooks },
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
  await redisClient.del(name);
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
  return { [name]: hooks[index] };
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
  if (option?.runner === "serial") {
    for (const hook of hooks) {
      const evaledFunc = eval(hook);
      console.log({ evaledFunc });
      await evaledFunc();
    }
  } else {
    await Promise.all(hooks.map((hook: any) => eval(JSON.parse(hook))()));
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
