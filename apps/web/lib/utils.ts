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
    runner: "serial",
  });
  addBf(() => {
    console.log("Do the preprocessing.");
  });
  const [currAf, addAf] = af();
  addAf(() => {
    console.log("Do the postprocessing.");
  });
  await callHook(hooks, "hook1");
  return { status: "ok" };
}
