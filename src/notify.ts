import { AppPubSubInterface, AppPubSubConstructor } from "../types";

const AppPubSub: AppPubSubConstructor = class implements AppPubSubInterface {
  topics: string[] = [];
  cbQueue = {}; // subscribe传递的
  paramsQueue = {}; // publish传递的 需要触发函数的参数存入队列
  constructor(topics) {
    // topics注册
    this.topics = topics;
    this.cbQueue = Object.fromEntries(topics.map((item) => [item, []]));
    this.paramsQueue = Object.fromEntries(topics.map((item) => [item, []]));
  }
  isValidTopic(topic) {
    // 是否合法topic
    return this.topics.includes(topic);
  }
  subscribe(topic, cb) {
    // target 存储子应用中需要执行的函数
    const isValidTopic = this.isValidTopic(topic);
    if (isValidTopic) {
      const len = this.paramsQueue[topic].length;
      if (len > 0) {
        // 在subscribe时，需要将paramsQueue中累计的参数消费掉，取最新的参数消费即可
        cb(this.paramsQueue[topic][len - 1]);
        this.paramsQueue[topic] = []; // 清空参数队列
      } else {
        // subscribe 在 publish 之前执行
        // 将函数存在topicList中
        this.cbQueue[topic].push(cb);
      }
    }
  }
  publish(topic, params) {
    const isValidTopic = this.isValidTopic(topic);
    if (isValidTopic) {
      // 有可能某些子应用还没加载完毕，此时publish已经触发了
      // 为了让子应用加载完毕后能够执行subscribe的cb，必须将此处的params存下来
      this.paramsQueue[topic].push(params); // 存储params
      if (this.paramsQueue[topic].length > 10) {
        // 只保留最新的10条数据
        const len = this.paramsQueue[topic].length;
        this.paramsQueue[topic] = this.paramsQueue[topic].slice(len - 10, len);
      }
      this.cbQueue[topic].forEach((cb) => cb(params)); // 执行已经subscribe的cb
    }
  }
  unsubscribe(topic, cb) {
    const isValidTopic = this.isValidTopic(topic);
    if (isValidTopic) {
      const i = this.cbQueue[topic].findIndex((d) => d === cb);
      if (i != -1) {
        this.cbQueue[topic].splice(i, 1);
      }
    }
  }
  clearParamsQueue(topic) {
    this.paramsQueue[topic] = [];
  }
};

export default AppPubSub;
