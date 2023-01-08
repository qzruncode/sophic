function isConstructor(fn) {
  const hasConstructor =
    fn.prototype &&
    fn.prototype.constructor === fn &&
    Object.getOwnPropertyNames(fn.prototype).length > 1;
  const functionStr = !hasConstructor && fn.toString();
  const upperCaseRegex = /^function\s+[A-Z]/;

  return (
    hasConstructor ||
    upperCaseRegex.test(functionStr) ||
    functionStr.slice(0, 5) === "class"
  );
}

function createSandbox(name) {
  const sandbox = new Proxy(window, {
    get(target, property, receiver) {
      if (property === Symbol.unscopables) {
        return undefined;
      }
      if (
        ["top", "window", "self", "globalThis"].includes(property as string)
      ) {
        return sandbox;
      }
      if (property === "hasOwnProperty") {
        return (key) => window.hasOwnProperty(key);
      }
      if (property in window.appState[name]) {
        return window.appState[name][property];
      } else {
        const windowValue = target[property];
        if (property === "eval") {
          return windowValue;
        }
        if (
          windowValue &&
          typeof windowValue === "function" &&
          !isConstructor(windowValue) // 如果是构造函数，不需要bind
        ) {

          return windowValue.bind(target);
        }
        return target[property];
      }
    },
    set(target, property, value, receiver) {
      if(!window.hasOwnProperty(property)) {
        // 如果不是window原生的属性，那么就存到appState中
        window.appState[name][property] = value;
      } else {
        target[property] = value;
      }
      return true;
    },
  });
  return sandbox;
}

export default createSandbox;
