import { CacheType, ISubAppList } from "../types";
import { excuteJavascript, excuteCss } from "./excute";
import { renderSubAppContianer } from "./render";

export function loadSubApp(subApp: ISubAppList, microApps, cacheType: CacheType) {
  return new Promise((resolve, reject) => {
    if (subApp) {
      fetch(subApp.entry)
        .then((res) => {
          if (res.ok) {
            return res.text();
          } else {
            reject("获取子应用index.html资源失败");
          }
        })
        .then((html: string | undefined) => {
          if (html) {
            const domContent = new DOMParser().parseFromString(
              html.replace(/<!--.*?-->/g, ""),
              "text/html"
            );
            // 修改base值，保证获取的url是子应用的
            const base = document.createElement("base");
            base.href = subApp.entry;
            domContent.getElementsByTagName("head")[0].appendChild(base);
            
            // 获取css
            const inlineStyleSheets = Array.from(
              domContent.getElementsByTagName("style")
            );
            const externalStyleSheets = Array.from(
              domContent.getElementsByTagName("link")
            ).filter((link) => !link.rel || link.rel.includes("stylesheet"));
            const inlineStyleSheetsText = inlineStyleSheets.map(
              (css) => css.innerText
            );
            const externalStyleSheetsUrls = externalStyleSheets.map(
              (css) => css.href
            );

            // 获取scripts标签的url
            const scripts = Array.from(
              domContent.getElementsByTagName("script")
            );
            const inlineScriptText: string[] = [];
            const externalScriptUrls: string[] = [];
            scripts.map((script) => {
              const url = script.src;
              if (url) {
                externalScriptUrls.push(url);
              }else {
                inlineScriptText.push(script.innerText)
              }

              if (url.includes("uid.js")) {
                // 直接执行
                fetch(url)
                  .then((res) => {
                    if (res.ok) {
                      return res.text();
                    } else {
                      reject("获取子应用Javascript资源失败");
                    }
                  })
                  .then((code) => {
                    if (code) {
                      !window.appState && (window.appState = {});
                      !window.appState[subApp.name] && (window.appState[subApp.name] = {});
                      const fn = new Function(code);
                      fn();

                      // 将子应用body上的class拼接到主应用的body上
                      document.body.className =
                        document.body.className +
                        " " +
                        domContent.body.className;
                      excuteCss(
                        inlineStyleSheetsText,
                        externalStyleSheetsUrls,
                        subApp.name,
                        microApps,
                        cacheType
                      ).catch((err) => {
                        reject(err);
                      });

                      // 渲染子应用容器
                      renderSubAppContianer(subApp);
                      // 执行子应用js
                      excuteJavascript(inlineScriptText, externalScriptUrls, subApp.name, cacheType)
                        .then(() => {
                          resolve("渲染完成");
                        })
                        .catch((err) => {
                          reject(err);
                        });
                    }
                  });
              }
            });
          } else {
            console.error('获取' + subApp.name + '微应用的html为空')
          }
        });
    } else {
      reject("子应用未注册");
    }
  });
}

export const preloadApp = (list, microApps, appLoadStatus, cacheType) => {
  const isExist = (name) => {
    return (
      Object.prototype.hasOwnProperty.call(microApps, name) &&
      microApps[name].mount
    );
  };
  list.forEach((d) => {
    if (!isExist(d.name)) {
      // 此微应用未加载过
      let appLoadStatu = appLoadStatus[d.name];
      if (!appLoadStatu) {
        // 没有加载状态则初始化一个
        appLoadStatus[d.name] = appLoadStatu = {
          status: "",
          callback: null,
        };
      }
      appLoadStatu.status = "pending";
      loadSubApp(d, microApps, cacheType)
        .then(() => {
          // 存储子应用的生命周期
          microApps[d.name] = Object.assign(
            {},
            microApps[d.name],
            window.appState[d.name][d.name]
          );
          appLoadStatu.status = "resolved";
          if (appLoadStatu.callback) {
            appLoadStatu.callback();
          }
        })
        .catch((err) => {
          console.error("renderSubAppErr", err);
          appLoadStatu.status = "rejected";
          // 提示错误
        });
    }
  });
};
