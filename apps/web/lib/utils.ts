import { hook, callHook, createBefter } from "@farming-labs/befter";
const hooks = createBefter();
export async function getStatus() {
  let {
    currHook: hookLists,
    afterMeta: af,
    beforeMeta: bf,
  } = hook(hooks, "hook1", () => {
    console.log("Excuting the main hook.");
  });
  const [currBf, addBf] = bf({
    runner: "parallel",
  });
  const func1 = () => {
    console.log("Do the preprocessing 1.");
  };
  const func2 = () => {
    console.log("Do the preprocessing 2.");
  };
  addBf([func1, func2]);

  const [currAf, addAf] = af();
  addAf(() => {
    console.log("Do the postprocessing.");
  });
  await callHook(hooks, "hook1");
  return { status: "ok" };
}
