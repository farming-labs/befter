import { describe, expect, test, vi, beforeAll, afterAll } from "vitest";
import { createBefter } from "../src";
import {
	callRedisHook,
	getRedisHook,
	getRedisHookWithIndex,
	hookRedis,
	updateRedisHook,
	removeRedisHookItself,
} from "../src/storage/redis";
import { createClient } from "redis";

let redisClient = null;
beforeAll(async () => {
	redisClient = createClient({ url: "redis://localhost:6379" });
	await redisClient.connect();
});
afterAll(async () => {
	await redisClient.flushAll();
	await redisClient.quit();
});

describe("Befter: [REDIS CORE]", () => {
	test("should create a hook with label", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
				client: redisClient,
			},
		});

		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists } = await hookRedis(
			hooks,
			"hook1",
			() => console.log("A main function for redis"),
			redisClient,
		);
		let hook1 = await getRedisHook(hooks, "hook1", redisClient);
		const hookLength = hook1["hook1"];
		expect(hookLength).toHaveLength(1);
		await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("A later function for redis");
			},
			redisClient,
		);
		hook1 = await getRedisHook(hooks, "hook1", redisClient);
		const hookLength2 = hook1["hook1"];
		expect(hookLength2).toHaveLength(2);

		await redisClient.flushAll();
	});

	test("should create a hook and purge it", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists, removeHook } = await hookRedis(
			hooks,
			"hook1",
			() => {},
			redisClient,
		);
		const hook1 = hookLists["hook1"];
		expect(hook1).toBeInstanceOf(Object);
		await hookRedis(hooks, "hook1", () => {}, redisClient);
		const currIndx = 0;
		const removedHook = await removeHook(
			hooks,
			"hook1",
			hook1[currIndx],
			redisClient,
		);
		expect(removedHook).toBeInstanceOf(Function);
		expect(hook1).toHaveLength(1);
		await redisClient.flushAll();
	});

	test("should create a hook and purge a non existent one", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists, removeHook } = await hookRedis(
			hooks,
			"hook1",
			() => {},
			redisClient,
		);
		const hook1 = hookLists["hook1"];
		expect(hook1).toBeInstanceOf(Object);
		await hookRedis(hooks, "hook1", () => {}, redisClient);
		const nonExistentHook = () => {
			console.log("I am not existent");
		};
		await expect(async () => {
			await removeHook(hooks, "hook1", nonExistentHook, redisClient);
		}).rejects.toThrow();

		await redisClient.flushAll();
	});

	test("should update a hook", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		const oldFn = () => {
			console.log("Old function");
		};
		const { currHook: hookLists, removeHook } = await hookRedis(
			hooks,
			"hook1",
			oldFn,
			redisClient,
		);
		let hook1 = hookLists["hook1"];

		const newFn = () => {
			console.log("Updated");
		};
		const updatedHook = await updateRedisHook(
			hooks,
			"hook1",
			oldFn,
			() => {
				console.log("Updated");
			},
			redisClient,
		);
		expect(updatedHook).toBeInstanceOf(Function);
		expect(hook1).toHaveLength(1);

		const hookUpdate = await getRedisHook(hooks, "hook1", redisClient);
		const hookFns = hookUpdate["hook1"];
		expect(eval(hookFns[0])).toBeInstanceOf(Function);
		await redisClient.flushAll();
	});
	test("should remove a hook itself", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});

		const { currHook } = await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		const removedHook = await removeRedisHookItself(
			hooks,
			"hook1",
			redisClient,
		);
		expect(removedHook).toStrictEqual(currHook);
		const hookAfterRemove = await redisClient.get("hook1");
		expect(hookAfterRemove).toBeNull();
		await redisClient.flushAll();
	});

	test("should call a hook", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});

		const consoleLogSpy = vi.spyOn(console, "log");
		await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		await callRedisHook(hooks, "hook1", redisClient);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
		await redisClient.flushAll();
	});

	test("should get function with in the hook lists based on the index", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);

		const { currHook } = await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		const hookFunctionByIndx = await getRedisHookWithIndex(
			hooks,
			"hook1",
			0,
			redisClient,
		);
		expect(hookFunctionByIndx).toBeInstanceOf(Object);
		expect(hookFunctionByIndx["hook1"]).toBeInstanceOf(Function);
		await redisClient.flushAll();
	});

	test("should call a hook lists", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		await callRedisHook(hooks, "hook1", redisClient);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");

		await redisClient.flushAll();
	});

	test("should call an async hook lists", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		const asyncFn = async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			console.log("This is an async function.");
		};
		const syncFn = () => {
			console.log("This is an sync function.");
		};
		await hookRedis(hooks, "hook1", [asyncFn, syncFn], redisClient);
		await callRedisHook(hooks, "hook1", redisClient);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is an sync function.");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is an async function.");

		await redisClient.flushAll();
	});

	test("should call before hooks", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);

		const consoleLogSpy = vi.spyOn(console, "log");
		const { afterMeta: af, beforeMeta: bf } = await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		const [currBf, addBf] = await bf({
			runner: "serial",
		});
		await addBf(() => {
			console.log("This is before");
		});
		const func1 = () => {
			console.log("This is before 1");
		};
		const func2 = () => {
			console.log("This is before 2");
		};
		const currBefore1 = await currBf();
		expect(currBefore1).toHaveLength(1);
		await addBf([func1, func2]);
		const currBefore2 = await currBf();
		expect(currBefore2).toHaveLength(3);
		await callRedisHook(hooks, "hook1", redisClient);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before 1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before 2");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");

		await redisClient.flushAll();
	});

	test("should call after hooks", async () => {
		const hooks = createBefter({
			storage: {
				type: "redis",
				url: "redis://localhost:6379",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		const { afterMeta: af } = await hookRedis(
			hooks,
			"hook1",
			() => {
				console.log("This is first");
			},
			redisClient,
		);
		const [currAf, addAf] = await af({ runner: "serial" });
		await addAf(() => {
			console.log("This is after");
		});
		const currAfter1 = await currAf();
		expect(currAfter1).toHaveLength(1);
		await callRedisHook(hooks, "hook1", redisClient);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is after");
		await redisClient.flushAll();
	});
});
