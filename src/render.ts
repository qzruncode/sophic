export function renderSubAppContianer(subApp) {
  // 渲染子应用容器
  // 判断 #sophic_container 容器中，有没有相应id为 subApp.container 的容器，如果有则复用，如果没有则创建
  const routerContainer = document.getElementById("sophic_container");
  if (routerContainer) {
    const appContainer = document.getElementById(subApp.container);
    if (!appContainer) {
      const subAppDiv = document.createElement("div");
      subAppDiv.style.height = "100%";
      subAppDiv.id = subApp.container;
      routerContainer.appendChild(subAppDiv);
    }
  }
}

export function showSubApp() {
  const routerContainer = document.getElementById("sophic_container");
  if (routerContainer) {
    routerContainer.style.height = "100%";
    routerContainer.style.display = "block";
  }
}

export function hideSubApp() {
  const routerContainer = document.getElementById("sophic_container");
  if (routerContainer) {
    routerContainer.style.height = "unset";
    routerContainer.style.display = "none";
  }
}
export function showLoading() {
  // 子应用未注册时，在渲染之前展示加载框
  const routerContainer = document.getElementById("loading");
  if (routerContainer) {
    routerContainer.style.display = "flex";
  }
}

export function hideLoading() {
  // 子应用未注册时，在渲染之前展示加载框
  const routerContainer = document.getElementById("loading");
  if (routerContainer) {
    routerContainer.style.display = "none";
  }
}
