import SimpleHistory from "simple-history";
import { ISubAppList, SophicConstructor, SophicInterface, AppPubSub as TAppPubSub, CacheType } from "../types";
import AppPubSub from "./notify";
import { loadSubApp, preloadApp } from "./preload";
import {
  showSubApp,
  hideSubApp,
  showLoading,
  hideLoading,
  renderSubAppContianer,
} from "./render";

export const Sophic: SophicConstructor = class implements SophicInterface {
  public microApps = {}; // 存放子应用的生命周期
  public appLoadStatus = {};
  public endLoding = false;
  public subAppList: Array<ISubAppList> = [];
  public appPubSub: TAppPubSub;
  public cacheType: CacheType;

  constructor(list: Array<ISubAppList>, cacheType: CacheType) {
    this.subAppList = list;
    this.cacheType = cacheType;
    this.appPubSub = new AppPubSub(this.subAppList.map((d) => d.name))
    !window.appState && (window.appState = {});
    window.appState.sophicInstance = this; // 只能存在一个Sophic实例
  }

  renderStyle(name) {
    const parent = document.getElementsByTagName("head")[0];
    const child = this.microApps[name].style;
    if (!parent.contains(child)) {
      parent.appendChild(child);
    } // 加载css
  }

  removeStyle(name) {
    const parent = document.getElementsByTagName("head")[0];
    const child = this.microApps[name].style;
    if (parent.contains(child)) {
      parent.removeChild(child);
    } // 移除css
  }

  registerSubApps() {
    {
      const path = window.location.pathname;
      const search = window.location.search;
      const app = this.subAppList.find((d) => path.startsWith(d.path));
      if (app) {
        // 主应用中的路由切换到子应用，需要手动通知子应用跳转
        SimpleHistory.push(path + search, {});
      }
    }

    preloadApp(this.subAppList, this.microApps, this.appLoadStatus, this.cacheType);

    const id = SimpleHistory.listen((action, preUrl, location) => {
      const subApp = this.subAppList.find((app) =>
        location.pathname.startsWith(app.path)
      );
      
      if (subApp) {
        // 判断微应用是否已经注册，如果没有注册，则请求文件，否则复用
        const isExist = (name) => {
          return (
            Object.prototype.hasOwnProperty.call(this.microApps, name) &&
            this.microApps[name].mount
          );
        };
        const excuteLifeCycle = () => {
          if (preUrl === location.pathname) {
            // 执行子应用的生命周期
            this.renderStyle(subApp.name);
            this.microApps[subApp.name].mount();
          } else {
            // 如果是链接到不同子应用的路由
            const preSubApp = this.subAppList.find((app) =>
              preUrl.startsWith(app.path)
            );
            if (preSubApp && isExist(preSubApp.name)) {
              // 这个应用有可能正在加载，但是还没有挂载成功，这个时候直接调用unmount会报错
              this.microApps[preSubApp.name].unmount &&
                this.microApps[preSubApp.name].unmount();
              this.removeStyle(preSubApp.name);
            }
            this.renderStyle(subApp.name);
            this.microApps[subApp.name].mount();
          }
        };

        if (!isExist(subApp.name)) {
          // 子应用未注册
          // 判断子应用是否已经在preloadApp中加载，但是加载还没完成，或者加载失败
          if (this.appLoadStatus[subApp.name].status === "pending") {
            showSubApp();
            // app正在加载
            showLoading(); // 渲染加载框
            this.appLoadStatus[subApp.name].callback = () => {
              renderSubAppContianer(subApp);
              // 执行子应用的生命周期
              if (!this.endLoding) {
                excuteLifeCycle();
              } else {
                this.endLoding = false;
              }
              // 渲染子应用完毕，隐藏加载框
              hideLoading();
            };
          } else if (this.appLoadStatus[subApp.name].status === "rejected") {
            // app预加载报错，重试一遍
            showSubApp();
            showLoading(); // 渲染加载框
            this.appLoadStatus[subApp.name].status = "pending";
            loadSubApp(subApp, this.microApps, this.cacheType).then(() => {
              // 存储子应用的生命周期
              this.microApps[subApp.name] = Object.assign(
                {},
                this.microApps[subApp.name],
                window.appState[subApp.name][subApp.name]
              );
              this.appLoadStatus[subApp.name].status = "resolved";

              renderSubAppContianer(subApp);
              // 执行子应用的生命周期
              if (!this.endLoding) {
                excuteLifeCycle();
              } else {
                this.endLoding = false;
              }
              // 渲染子应用完毕，隐藏加载框
              hideLoading();
            }).catch((err) => {
              console.error("renderSubAppErr", err);
              this.appLoadStatus[subApp.name].status = "rejected";
              // 提示错误
            });
          } else if (this.appLoadStatus[subApp.name].status === "resolved") {
            hideLoading();
            showSubApp();
            // 子应用注册了
            renderSubAppContianer(subApp);
            excuteLifeCycle();
          }
        } else {
          renderSubAppContianer(subApp);
          hideLoading();
          showSubApp();
          // 子应用注册了
          excuteLifeCycle();
        }
      } else {
        // 子应用匹配不成功，提示错误
        console.error("没有注册这个子应用");
      }
    });
  }

  execSubApp() {
    this.unmountSubApps();
    const path = window.location.pathname;
    const search = window.location.search;

    if (this.subAppList.some((d) => path.startsWith(d.path))) {
      const app = this.subAppList.find((d) => path.startsWith(d.path));
      if (app) {
        // 主应用中的路由切换到子应用，需要手动通知子应用跳转
        SimpleHistory.push(path + search, {});
      }
    }
  }

  unmountSubApps() {
    Object.keys(this.microApps).forEach((appName) => {
      const app = this.microApps[appName];
      if (app.unmount) {
        // 这个应用有可能正在加载，但是还没有挂载成功，这个时候直接调用unmount会报错
        app.unmount();
      } else {
        this.endLoding = true; // 如果应用都还没有加载完成，在主应用中就已经调用了 unmountSubApps，这时候 endLoding 设置为 true，在 registerSubApps 中禁止执行子应用生命周期函数
      }

      this.removeStyle(appName);
    });
    hideSubApp();
  }

  static handleHasMaster(name) {
    return !!(window.appState && window.appState[name]);
  }

  static getSophic() {
    return window.appState.sophicInstance;
  }
};
