export type InterceptCb = (...arg: any) => Promise<void> | void;
export type ExtractKey<T> = keyof T & string;
export type Intercept = { [key: string]: Intercept };
export type InferCb<T, N extends keyof T> = T[N] extends InterceptCb
  ? T[N]
  : never;

export type BaseBefterState<HooksT> = {
  hooks: {
    [key: string]: InterceptCb[];
    before: InterceptCb[];
    after: InterceptCb[];
  };
};

export type oneHookState = { [key: string]: InterceptCb[] };

export type InferInterceptCallback<
  HT,
  HN extends keyof HT,
> = HT[HN] extends InterceptCb ? HT[HN] : never;
