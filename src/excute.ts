import createSandbox from "./sandbox";
import { storeCodes, getCodes } from "./cache";
import { TableName } from "./const";
import { CacheType } from "../types";

export function excuteJavascript(
  inlineScriptText,
  externalScriptUrls,
  name,
  cacheType: CacheType
) {
  return new Promise((resolve, reject) => {
    const fn = (codes) => {
      const allCodes = [...inlineScriptText, ...codes];
      const sandbox = createSandbox(name);
      allCodes.forEach((code) => {
        try {
          const execScript = `with (sandbox) {;${code}\n}`;
          const js = new Function("sandbox", execScript).bind(sandbox);
          js(sandbox);
        } catch (error) {
          console.error(
            `error occurs when execute script in sandbox: ${error}`,
            code
          );
          throw error;
        }
      });
      resolve("Javascript渲染完成");
    };
    if (cacheType === "nocache") {
      Promise.all(
        externalScriptUrls.map((url) =>
          fetch(url).then((res) => {
            if (res.ok) {
              return res.text();
            } else {
              reject("获取子应用Javascript资源失败");
            }
          })
        )
      ).then((codes) => {
        fn(codes);
      });
    } else if (cacheType === "indexedDB") {
      getCodes(name, TableName.JSLIST)
        .then((codes) => {
          fn(codes);
        })
        .catch((err) => {
          Promise.all(
            externalScriptUrls.map((url) =>
              fetch(url).then((res) => {
                if (res.ok) {
                  return res.text();
                } else {
                  reject("获取子应用Javascript资源失败");
                }
              })
            )
          ).then((codes) => {
            fn(codes);
            storeCodes(codes, name, TableName.JSLIST);
          });
        });
    } else {
      Promise.all(
        externalScriptUrls.map((url) =>
          fetch(url + `?appType=sub&appName=${name}`).then((res) => {
            if (res.ok) {
              return res.text();
            } else {
              reject("获取子应用Javascript资源失败");
            }
          })
        )
      ).then((codes) => {
        fn(codes);
      });
    }
  });
}

export function excuteCss(
  inlineStyleSheetsText,
  externalStyleSheetsUrls,
  name,
  microApps,
  cacheType: CacheType
) {
  return new Promise((resolve, reject) => {
    const fn = (codes) => {
      const allCodes = [...inlineStyleSheetsText, ...codes].join("");
      const styleElement: HTMLStyleElement = document.createElement("style");
      styleElement.innerHTML = allCodes;

      // 为了实现css样式隔离，在不修改子应用代码的情况下，主应用只做 路由的管理
      // 主应用路由到某个子应用时，加载此应用的css，并且保存在microApps上
      if (microApps[name]) {
        // 将此应用的 styleElement 保存下来
        microApps[name].style = styleElement;
      } else {
        microApps[name] = {
          style: styleElement,
        };
      }
    };

    if (cacheType === "nocache") {
      Promise.all(
        externalStyleSheetsUrls.map((url) =>
          fetch(url).then((res) => {
            if (res.ok) {
              return res.text();
            } else {
              reject("获取子应用css资源失败");
            }
          })
        )
      ).then((codes) => {
        fn(codes);
      });
    } else if (cacheType === "indexedDB") {
      getCodes(name, TableName.CSSLIST)
        .then((codes) => {
          fn(codes);
        })
        .catch((err) => {
          Promise.all(
            externalStyleSheetsUrls.map((url) =>
              fetch(url).then((res) => {
                if (res.ok) {
                  return res.text();
                } else {
                  reject("获取子应用css资源失败");
                }
              })
            )
          ).then((codes) => {
            fn(codes);
            storeCodes(codes, name, TableName.CSSLIST);
          });
        });
    } else {
      Promise.all(
        externalStyleSheetsUrls.map((url) =>
          fetch(url + `?appType=sub&appName=${name}`).then((res) => {
            if (res.ok) {
              return res.text();
            } else {
              reject("获取子应用css资源失败");
            }
          })
        )
      ).then((codes) => {
        fn(codes);
      });
    }
  });
}
