import { hook, createBefter } from "@farming-labs/befter"
const hooks = createBefter();
export function getStatus() {
  let { currHook: hookLists } = hook(hooks, "hook1", () => {
    console.log("Excuting the main hook.")

  });
  console.log({ hookLists });
  return { status: "ok" }
}

