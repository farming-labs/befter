import { hook, callHook, createBefter } from "@farming-labs/befter";
const hooks = createBefter();
export async function getStatus() {
  let { currHook: hookLists } = hook(hooks, "hook1", () => {
    console.log("Excuting the main hook.");
  });
  await callHook(hooks, "hook1");
  return { status: "ok" };
}
