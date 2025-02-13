import { describe, expect, test, vi } from "vitest";
import { createBefter } from "../src";
import {
	callLocalHook,
	getLocalHook,
	getLocalHookWithIndex,
	hookLocal,
	removeLocalHookItself,
	updateLocalHook,
} from "../src/storage/local";
describe("Befter: [CORE]", () => {
	test("should create a hook with label", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists } = hookLocal(hooks, "hook1", () => {});
		const hook1 = hookLists["hook1"];
		expect(hook1).toHaveLength(1);
		hookLocal(hooks, "hook1", () => {});
		expect(hook1).toHaveLength(2);
		expect(hook1).toEqual([expect.any(Function), expect.any(Function)]);
	});
	test("should create a hook and purge it", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists, removeHook } = hookLocal(
			hooks,
			"hook1",
			() => {},
		);
		const hook1 = hookLists["hook1"];
		expect(hook1).toBeInstanceOf(Object);
		hookLocal(hooks, "hook1", () => {});
		const currIndx = 0;
		const removedHook = removeHook(hooks, "hook1", hook1[currIndx]);
		expect(removedHook).toBeInstanceOf(Function);
		expect(hook1).toHaveLength(1);
	});

	test("should create a hook and purge a non existent one", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookLists, removeHook } = hookLocal(
			hooks,
			"hook1",
			() => {},
		);
		const hook1 = hookLists["hook1"];
		expect(hook1).toBeInstanceOf(Object);
		hookLocal(hooks, "hook1", () => {});
		const currIndx = 0;
		const nonExistentHook = () => {
			console.log("I am not existent");
		};
		expect(() => {
			removeHook(hooks, "hook1", nonExistentHook);
		}).toThrow();
	});

	test("should remove hook itself", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const { currHook: hookList1, removeHook: removeHook1 } = hookLocal(
			hooks,
			"hook1",
			() => {
				console.log("I am removed");
			},
		);
		const { currHook: hookList2, removeHook: removeHook2 } = hookLocal(
			hooks,
			"hook2",
			() => {},
		);
		expect(hookList1).toBeInstanceOf(Object);
		const removedHook = removeLocalHookItself(hooks, "hook1");

		expect(removedHook).toBeInstanceOf(Object);
	});
	test("should get a hook lists", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		hookLocal(hooks, "hook1", () => {});
		const currHook = getLocalHook(hooks, "hook1");
		expect(currHook).toBeInstanceOf(Object);
	});
	test("should update a labeled hook", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);

		const { currHook } = hookLocal(hooks, "hook1", () => {
			console.log("This is first");
		});
		const consoleLogSpy = vi.spyOn(console, "log");
		await callLocalHook(hooks, "hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
		// expect(currHook).toBeInstanceOf(Object);
		updateLocalHook(hooks, "hook1", currHook["hook1"][0], () => {
			console.log("This is updated");
		});
		await callLocalHook(hooks, "hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is updated");
	});
	test("should get function with in the hook lists based on the index", () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);

		const { currHook } = hookLocal(hooks, "hook1", () => {
			console.log("This is first");
		});
		const hookFunctionByIndx = getLocalHookWithIndex(hooks, "hook1", 0);
		expect(hookFunctionByIndx).toBeInstanceOf(Object);
		expect(hookFunctionByIndx["hook1"]).toBeInstanceOf(Function);
	});
	test("should call a hook lists", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		hookLocal(hooks, "hook1", () => {
			console.log("This is first");
		});
		await callLocalHook(hooks, "hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
	});
	test("should call an async hook lists", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
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
		hookLocal(hooks, "hook1", [asyncFn, syncFn]);
		await callLocalHook(hooks, "hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is an sync function.");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is an async function.");
	});
	test("should call before hooks", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);

		const consoleLogSpy = vi.spyOn(console, "log");
		const { afterMeta: af, beforeMeta: bf } = hookLocal(hooks, "hook1", () => {
			console.log("This is first");
		});
		const [currBf, addBf] = bf({
			runner: "serial",
		});
		addBf(() => {
			console.log("This is before");
		});
		// adding a list of functions
		const func1 = () => {
			console.log("This is before 1");
		};
		const func2 = () => {
			console.log("This is before 2");
		};
		addBf([func1, func2]);
		expect(currBf).toHaveLength(3);
		await callLocalHook(hooks, "hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before 1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is before 2");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
	});
	test("should call after hooks", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		const { beforeMeta: bf, afterMeta: af } = hookLocal(hooks, "hook1", () => {
			console.log("This is first");
		});
		const [currAf, addAf] = af();
		addAf(() => {
			console.log("This is after");
		});
		expect(currAf).toHaveLength(1);
		await callLocalHook(hooks, "hook1");

		expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is after");
	});
	test("should call hooks based on option config (runner = parallel)", async () => {
		const hooks = createBefter({
			storage: {
				type: "local",
			},
		});
		expect(hooks).toBeInstanceOf(Object);
		const consoleLogSpy = vi.spyOn(console, "log");
		const mainHookFunc1 = () => {
			console.log("This is hook1");
		};

		const mainHookFunc2 = () => {
			console.log("This is hook1");
		};
		const {
			currHook,
			beforeMeta: bf1,
			afterMeta: af1,
		} = hookLocal(hooks, "hook1", [mainHookFunc1, mainHookFunc2]);

		expect(currHook["hook1"]).toBeInstanceOf(Array);

		expect(currHook["hook1"]).toHaveLength(2);
		const [currAf1, addAf1] = af1({
			runner: "serial",
		});
		addAf1(() => {
			console.log("This is after hook1");
		});
		const { beforeMeta: bf2, afterMeta: af2 } = hookLocal(
			hooks,
			"hook2",
			() => {
				console.log("This is hook2");
			},
		);
		const [currAf2, addAf2] = af2({
			runner: "parallel",
		});
		addAf2(() => {
			console.log("This is after hook2");
		});

		let startTime = performance.now();
		await callLocalHook(hooks, "hook1");
		let endTime = performance.now();
		const timeDiffOnSerial = endTime - startTime;

		startTime = performance.now();
		await callLocalHook(hooks, "hook2", { runner: "parallel" });
		endTime = performance.now();
		const timeDiffOnParallel = endTime - startTime;

		const totalDiffOnConfig = timeDiffOnSerial - timeDiffOnParallel;
		expect(totalDiffOnConfig).greaterThan(0);
		expect(consoleLogSpy).toHaveBeenCalledWith("This is hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is hook2");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is after hook1");
		expect(consoleLogSpy).toHaveBeenCalledWith("This is after hook2");
	});
});
