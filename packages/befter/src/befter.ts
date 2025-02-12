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
// export function createBefter<
//   HooksT extends Record<string, any>,
// >(): BaseBefterState<HooksT> {
//   return {
//     hooks: {
//       after: [],
//       before: [],
//     },
//   };
// }
// export function hook<
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   function_:
//     | InferInterceptCallback<HooksT, NameT>
//     | InferInterceptCallback<HooksT, NameT>[],
//   options: {
//     allowDeprecated?: boolean;
//     afterRunner?: hookFunctionRunner;
//     beforeRunner?: hookFunctionRunner;
//     runner?: hookFunctionRunner;
//     storage?: Storage;
//   } = {
//     allowDeprecated: false,
//     afterRunner: "serial",
//     beforeRunner: "serial",
//     runner: "serial",
//     storage: "local"
//   },
// ): {
//   currHook: oneHookState;
//   beforeMeta: (option?: {
//     runner: "serial" | "parallel";
//   }) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
//   afterMeta: (option?: {
//     runner: "serial" | "parallel";
//   }) => [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void];
//   removeHook: (
//     state: BaseBefterState<HooksT>,
//     name: HookKeys<HooksT>,
//     function_: InferInterceptCallback<HooksT, NameT>,
//   ) => void;
// } {
//   const { hooks } = state;
//   const existingHook = getHook(state, name);

//   hooks[`${name}`] = hooks[`${name}`] || [];
//   if (Array.isArray(function_)) {
//     hooks[name].push(...function_);
//   } else {
//     hooks[name].push(function_);
//   }

//   const { before, after } = hooks;

//   const beforeMetas = (
//     option: { runner: "serial" | "parallel" } = { runner: "serial" },
//   ): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void] => {
//     const addBefores = (cb: InterceptCb | InterceptCb[]) => {
//       if (Array.isArray(cb)) {
//         before.push(...cb);
//       } else {
//         before.push(cb);
//       }
//     };
//     return [before, addBefores];
//   };

//   const afterMetas = (
//     option: { runner: "serial" | "parallel" } = { runner: "serial" },
//   ): [InterceptCb[], (cb: InterceptCb | InterceptCb[]) => void] => {
//     options.afterRunner = option.runner;
//     const addAfters = (cb: InterceptCb | InterceptCb[]) => {
//       if (Array.isArray(cb)) {
//         after.push(...cb);
//       } else {
//         after.push(cb);
//       }
//     };
//     return [after, addAfters];
//   };

//   return {
//     currHook: { [name]: hooks[name] },
//     beforeMeta: beforeMetas,
//     afterMeta: afterMetas,
//     removeHook: (
//       state: BaseBefterState<HooksT>,
//       name: HookKeys<HooksT>,
//       function_: InferInterceptCallback<HooksT, NameT>,
//     ) => removeHook(state, name, function_),
//   };
// }
// export const callHookFromState = (state: oneHookState) => {};

// export function hookBefore<
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: string,
//   function_: InferInterceptCallback<HooksT, NameT>,
//   options: { allowDeprecated?: boolean } = {},
// ): [InterceptCb[], () => void] {
//   let {
//     hooks: { before },
//   } = state;
//   before?.push(function_);

//   return [
//     before!,
//     () => {
//       before = [];
//     },
//   ];
// }
// export const updateHook = <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   function_: InferInterceptCallback<HooksT, NameT>,
//   updatedFunction_: InferInterceptCallback<HooksT, NameT>,
// ): InterceptCb => {
//   const { hooks } = state;
//   const index = hooks[name].indexOf(function_);
//   const updatedHook: InterceptCb = hooks[name][index];
//   if (index !== -1) {
//     hooks[name][index] = updatedFunction_;
//   }
//   return updatedHook;
// };
// export const removeHook = <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   function_: InferInterceptCallback<HooksT, NameT>,
// ): InterceptCb => {
//   const { hooks } = state;
//   const index = hooks[name].indexOf(function_);
//   const removedHook: InterceptCb = hooks[name][index];
//   if (index !== -1) {
//     hooks[name].splice(index, 1);
//   } else {
//     throw new Error("[BEFTER]: Hook not found");
//   }
//   return removedHook;
// };
// export const removeHookItSelf = <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
// ): oneHookState | null => {
//   const { hooks } = state;
//   let removedHook: oneHookState | null = null;
//   Object.keys(hooks).map((hk) => {
//     if (hk === name) {
//       removedHook = { [hk]: hooks[hk] };
//       delete hooks[name];
//     }
//   });
//   return removedHook;
// };

// export const getHookWithIndex = <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   indx: number,
// ): { [name: string]: oneHookState[string][number] } | null => {
//   const { hooks } = state;
//   if (hooks.hasOwnProperty(name)) {
//     const currHook = hooks[name];
//     if (indx >= currHook.length) return null;
//     return { [name]: currHook[indx] };
//   } else {
//     return null;
//   }
// };
// export const getHook = <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
// ): oneHookState | null => {
//   const { hooks } = state;
//   if (hooks.hasOwnProperty(name)) {
//     return { [name]: hooks[name] };
//   } else {
//     return null;
//   }
// };

// export const callHook = async <
//   HooksT extends Record<string, any>,
//   NameT extends HookKeys<HooksT>,
// >(
//   state: BaseBefterState<HooksT>,
//   name: NameT,
//   option: {
//     runner: "serial" | "parallel";
//   } = { runner: "serial" },
// ): Promise<void> => {
//   const { hooks } = state;
//   if (option?.runner === "serial") {
//     await serialCallerFunc(state, name);
//   } else {
//     await parallelCallerFunc(state, name);
//   }
// };

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

import { parallelCallerFunc, serialCallerFunc } from "./helper";
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
// Create Befter state
export function createBefter<HooksT extends Record<string, any>>(options: {
  storage: {
    type: Storage;
    url?: string;
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
): OneHookState {
  if (state.storage.type === "redis" && state.storage.url) {
    hookRedis(state, name, function_, state.storage.url);
  } else {
    hookLocal(state, name, function_);
  }

  return { [name]: state.hooks[name] || [] };
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
): InterceptCb {
  if (state.storage.type === "redis" && state.storage.url) {
    return updateRedisHook(name, oldFunction, newFunction, state.storage.url);
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
): InterceptCb {
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
>(state: BaseBefterState<HooksT>, name: NameT): OneHookState | null {
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
