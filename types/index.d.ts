import SimpleHistory from "simple-history";

export type CacheType = "nocache" | "indexedDB" | "sw"
export interface ISubAppList {
  name: string;
  entry: string;
  path: string;
  container: string;
}
export const History = SimpleHistory;
export type SophicConstructor = new (list: Array<ISubAppList>, cacheType: CacheType) => SophicInterface;
export interface SophicInterface {
  microApps: {};
  appLoadStatus: {};
  endLoding: boolean;
  subAppList: Array<ISubAppList>;
  appPubSub: AppPubSub;
  cacheType: CacheType;
  renderStyle(name: string): void;
  renderStyle(name: string): void;
  registerSubApps(): void;
  execSubApp(): void;
  unmountSubApps(): void;
}

export type AppPubSubConstructor = new (topics: Array<string>) => AppPubSubInterface;
export interface AppPubSubInterface {
  topics: string[];
  cbQueue: {};
  paramsQueue: {};
  isValidTopic(topic: string): boolean;
  subscribe(topic: string, cb: Function): void;
  publish(topic: string, params: any): void;
  unsubscribe(topic: string, cb: Function): void;
  clearParamsQueue(topic: string): void;
}

export class AppPubSub {
  topics: string[];
  cbQueue: {};
  paramsQueue: {};
  constructor(topics: string[]) {}
  isValidTopic(topic: string): boolean;
  subscribe(topic: string, cb: Function): void;
  publish(topic: string, params: any): void;
  unsubscribe(topic: string, cb: Function): void;
  clearParamsQueue(topic: string): void;
}

export class Sophic {
  microApps: {};
  appLoadStatus: {};
  endLoding: boolean;
  subAppList: Array<ISubAppList>;
  appPubSub: AppPubSub;
  cacheType: CacheType;
  constructor(list: Array<ISubAppList>, cacheType: CacheType) {}
  renderStyle(name: string): void;
  renderStyle(name: string): void;
  registerSubApps(): void;
  execSubApp(): void;
  unmountSubApps(): void;
  static handleHasMaster(name: string): boolean;
  static getSophic(): Sophic;
}