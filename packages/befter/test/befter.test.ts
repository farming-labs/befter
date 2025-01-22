import { describe, test, beforeEach, expect, vi } from "vitest";
import {
  callHook,
  createBefter,
  getHook,
  getHookWithIndex,
  hook,
  removeHook,
  removeHookItSelf,
  updateHook,
} from "../src/befter";
describe("Befter: [CORE]", () => {
  test("should create a hook with label", () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    let { currHook: hookLists } = hook(hooks, "hook1", () => {});
    console.log({ hookLists });
    const hook1 = hookLists["hook1"];
    expect(hook1).toHaveLength(1);
    hook(hooks, "hook1", () => {});
    expect(hook1).toHaveLength(2);
    expect(hook1).toEqual([expect.any(Function), expect.any(Function)]);
  });
  test("should create a hook and purge it", () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    let { currHook: hookLists, removeHook: removeHook } = hook(
      hooks,
      "hook1",
      () => {},
    );
    const hook1 = hookLists["hook1"];
    expect(hook1).toBeInstanceOf(Object);
    hook(hooks, "hook1", () => {});
    const currIndx = 0;
    const removedHook = removeHook(hooks, "hook1", hook1[currIndx]);
    expect(removedHook).toBeInstanceOf(Function);
    expect(hook1).toHaveLength(1);
    // removeHook1(hooks, "hook1");
  });
  test("should remove hook itself", () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    const { currHook: hookList1, removeHook: removeHook1 } = hook(
      hooks,
      "hook1",
      () => {
        console.log("I am removed");
      },
    );
    const { currHook: hookList2, removeHook: removeHook2 } = hook(
      hooks,
      "hook2",
      () => {},
    );
    expect(hookList1).toBeInstanceOf(Object);
    const removedHook = removeHookItSelf(hooks, "hook1");

    expect(removedHook).toBeInstanceOf(Object);
  });
  test("should get a hook lists", () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    hook(hooks, "hook1", () => {});
    const currHook = getHook(hooks, "hook1");
    expect(currHook).toBeInstanceOf(Object);
  });
  test("should update a labeled hook", async () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);

    const { currHook } = hook(hooks, "hook1", () => {
      console.log("This is first");
    });
    const consoleLogSpy = vi.spyOn(console, "log");
    await callHook(hooks, "hook1");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
    // expect(currHook).toBeInstanceOf(Object);
    updateHook(hooks, "hook1", currHook["hook1"][0], () => {
      console.log("This is updated");
    });
    await callHook(hooks, "hook1");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is updated");
  });
  test("should get function with in the hook lists based on the index", () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);

    const { currHook } = hook(hooks, "hook1", () => {
      console.log("This is first");
    });
    const hookFunctionByIndx = getHookWithIndex(hooks, "hook1", 0);
    expect(hookFunctionByIndx).toBeInstanceOf(Object);
    expect(hookFunctionByIndx["hook1"]).toBeInstanceOf(Function);
  });
  test("should call a hook lists", async () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    const consoleLogSpy = vi.spyOn(console, "log");
    hook(hooks, "hook1", () => {
      console.log("This is first");
    });
    await callHook(hooks, "hook1");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
  });
  test("should call before hooks", async () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);

    const consoleLogSpy = vi.spyOn(console, "log");
    const { afterMeta: af, beforeMeta: bf } = hook(hooks, "hook1", () => {
      console.log("This is first");
    });
    const [currBf, addBf] = bf({
      runner: "serial",
    });
    addBf(() => {
      console.log("This is before");
    });
    expect(currBf).toHaveLength(1);
    await callHook(hooks, "hook1");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is before");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
  });
  test("should call after hooks", async () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    const consoleLogSpy = vi.spyOn(console, "log");
    const { beforeMeta: bf, afterMeta: af } = hook(hooks, "hook1", () => {
      console.log("This is first");
    });
    const [currAf, addAf] = af();
    addAf(() => {
      console.log("This is after");
    });
    expect(currAf).toHaveLength(1);
    await callHook(hooks, "hook1");

    expect(consoleLogSpy).toHaveBeenCalledWith("This is first");
    expect(consoleLogSpy).toHaveBeenCalledWith("This is after");
  });
  test("should call hooks based on option config [parallel]", async () => {
    const hooks = createBefter();
    expect(hooks).toBeInstanceOf(Object);
    const consoleLogSpy = vi.spyOn(console, "log");
    const { beforeMeta: bf1, afterMeta: af1 } = hook(hooks, "hook1", () => {
      console.log("This is hook1");
    });
    const [currAf1, addAf1] = af1({
      runner: "serial",
    });
    addAf1(() => {
      console.log("This is after hook1");
    });
    const { beforeMeta: bf2, afterMeta: af2 } = hook(hooks, "hook2", () => {
      console.log("This is hook2");
    });
    const [currAf2, addAf2] = af2({
      runner: "parallel",
    });
    addAf2(() => {
      console.log("This is after hook2");
    });

    let startTime = performance.now();
    await callHook(hooks, "hook1", { runner: "serial" });
    let endTime = performance.now();
    const timeDiffOnSerial = endTime - startTime;

    startTime = performance.now();
    await callHook(hooks, "hook2", { runner: "parallel" });
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
