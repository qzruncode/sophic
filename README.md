[![NPM version](https://img.shields.io/npm/v/sophic.svg)](https://www.npmjs.com/package/sophic)
[![NPM package](https://img.shields.io/npm/dy/sophic.svg)](https://www.npmjs.com/package/sophic)


## sophic微应用框架

### 为什么要设计此框架？

1. 为了尽可能少改造原项目代码，更好实现css隔离和js隔离
2. 为了在主应用中用户访问子应用更加丝滑（实现方式：预加载 + 缓存）
3. 为了和[dark-tunnel](https://www.npmjs.com/package/dark-tunnel)构建工具一起使用，能够更加方便的初始化应用模板，避免繁琐配置
4. ...

### 使用示例

```
安装dark-tunnel脚手架工具
npm install dark-tunnel -g

初始化主应用模板
mkdir masterApp
cd masterApp
dark init sophic-master-template
npm install

初始化子应用模板
cd ../
mkdir subApp
cd subApp
dark init sophic-template
npm install
npm start 启动服务后，通过 https://local.test.com:3002/sub 可以单独访问子应用

启动主应用
cd masterApp
npm start 启动服务后，通过 https://local.test.com:3001 访问主应用，并且在主应用中查看子应用
如果在主应用中开启"sw"缓存，需要禁止chrome跨域，在命令行中执行 /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir=/tmp/foo --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://localhost:3001/
```

### 主应用中注册微应用

```
import { Sophic } from 'sophic';
const subApps = [
  {
    name: 'sophicTemplate',
    entry: 'https://local.test.com:3002/',
    path: '/sub',
    container: 'sophicTemplate', // 渲染微应用的容器id
  },
];
const sophic = new Sophic(Array.from(subApps));
sophic.registerSubApps();

注：
  1. sophic.subAppList 存储注册的微应用列表，列表中元素的name属性会作为发布订阅的topics
  2. 执行registerSubApps函数会立即预加载微应用的资源，这能有效的提高用户体验，避免微应用过大导致的加载等待时间太长
  3. sophic.microApps 用于存储微应用的生命周期，如果此属性中存在某个微应用（通过name属性判断）证明此微应用加载过
  4. 如果微应用未加载过，则执行加载逻辑，sophic.appLoadStatus 存储微应用的加载状态，有'pending'、'resolved'、'rejected'
    1）首先，根据微应用列表中的entry字段所配置的路径，去获取微应用的html代码
    2）获取style标签中的css，link标签的href
    3）获取所有的script标签，收集其中的url，如果存在uid.js则立即获取此文件并且执行，此文件中的uid用于缓存微应用的静态资源
    4）会将子应用body标签的class属性合并到主应用的body标签
    5）为了实现样式隔离，怎么办？
      a. 请求获取微应用所有css外部link标签的代码，并将这些代码和style标签中的css代码合并，随后生成一个新的style标签，用一个独立的style标签渲染这些css代码
      b. 将此style标签的引用存到sophic.microApps的style属性中，销毁微应用时会删除此style标签
    6）渲染微应用的容器，在主应用中需要写死一个标签 <div id="sophic_container"></div> 所有的微应用代码最终都渲染到此标签中
    7）为了实现js隔离，怎么办？
      a. 请求获取微应用所有js外部script标签的代码，并将这些代码和内联script标签中的代码合并成一个数组
      b. 使用js沙箱的方式去执行数组中的每个元素，js代码中存储window全局变量都会代理到window.appState[name]上，其中name为微应用列表中的name字段
  5. 使用simple-history包进行路由监听

在主应用中如果路由匹配到子路由，需要手动执行 sophic.execSubApp() 渲染微应用
```

### 微应用

```
子应用需要提供mount和unmount钩子，例如：

const subAppName = 'sophicTemplate';
const hasMaster = Sophic.handleHasMaster(subAppName); // 是否在主应用中加载
let root;
export function mount({ History, appPubSub }: any) {
  root = ReactDOM.createRoot(document.getElementById(subAppName) as HTMLElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={createRouter({ appPubSub })} />
    </React.StrictMode>
  );
}
export function unmount() {
  root && root.unmount();
}
if (!hasMaster) { // 如果不是在主应用中访问的，则直接渲染
  mount({});
}
// 通过在webpack配置项的output中指定libraryTarget和library也能达到相同的效果
// 如果你使用其他第三方脚手架，则需要额外改造，为了避免这个操作，直接在window上传递
window[subAppName] = {
  mount,
  unmount,
};

注：在子应用中如何跳转到主应用的页面？
  由于子应用和主应用都是独立的路由系统，在子应用中直接跳转到主应用的页面无效。解决这种问题有两种方式
  方式一：得益于a标签的跳转会刷新整个页面，在子应用中可以直接通过a标签跳转主应用的页面
  方式二：使用sophic提供的appPubSub，其采用发布订阅的模式实现子应用告知主应用跳转页面，从而实现路由跳转而无需刷新整个页面
    主应用：
      sophic.appPubSub.subscribe('sophicTemplate', ...)
    子应用：
      sophic.appPubSub.publish('sophicTemplate', {
        from: 'sophicTemplate',
        message: '/main'
      })
```

### 缓存

```
子应用资源是从网络中获取的，为了实现前端独立的管理缓存资源加快访问速度，Sophic提供了三种缓存方式
  "nocache"：无缓存
  "indexedDB"：采用indexedDB缓存，必须在子应用中配置uid.js文件，并配合dark-tunnel打包工具，在每次编译过程中会生成唯一的uid，根据此uid进行缓存的复用和更新。此方式具有稳定可靠的优点。
  "sw"：使用service worker拦截请求，资源缓存在cache中，这种模式在浏览器独立线程中缓存资源，用户体验会更加丝滑
```