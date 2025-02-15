"use server";

import { createBefter, hook } from "@farming-labs/befter";
import { createClient } from "redis";
const redisClient = createClient({ url: "redis://localhost:6379" });
await redisClient.connect();
export const getStatusWithRedis = async () => {
  await redisClient.wait(2, 10);
  const hooks = createBefter({
    storage: {
      type: "redis",
      url: "redis://localhost:6379",
      client: redisClient,
    },
  });
  const { currHook: hookLists } = await hook(
    hooks,
    "hook1",
    () => console.log("A main function for redis"),
    { runner: "serial" },
  );

  console.log({ hookLists });
};
