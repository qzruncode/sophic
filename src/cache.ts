import { TableName } from "./const";

const dbName = "SophicDB";

export function storeCodes(codes, name, table) {
  const dbr = indexedDB.open(dbName);
  const version = window.appState[name].uid;
  dbr.onsuccess = () => {
    const db = dbr.result;
    const transaction = db.transaction(table, "readwrite");
    const objectStore = transaction.objectStore(table);
    objectStore.put({
      value: codes,
      appName: name,
      version: version,
    });
  };
  dbr.onupgradeneeded = function (e: any) {
    if(e.target) {
      const db = e.target.result; // 获取IDBDatabase
      db.createObjectStore(TableName.JSLIST, { keyPath: "appName" });
      db.createObjectStore(TableName.CSSLIST, { keyPath: "appName" });
    }
  };
}

export function getCodes(name, table) {
  return new Promise((resolve, reject) => {
    const dbr = indexedDB.open(dbName);
    dbr.onsuccess = () => {
      const db = dbr.result;
      const transaction = db.transaction(table, "readwrite");
      const objectStore = transaction.objectStore(table);
      const req = objectStore.get(name);
      req.onsuccess = function (e: any) {
        if (e.target != null && e.target.result && e.target.result.value) {
          const newVersion = window.appState[name].uid;
          const oldVersion = e.target.result.version;
          if (newVersion == oldVersion) {
            resolve(e.target.result.value);
          } else {
            reject("没数据");
          }
        } else {
          reject("没数据");
        }
      };
      req.onerror = function (e) {
        reject("没数据");
      };
    };
    dbr.onupgradeneeded = function (e: any) {
      if (e.target) {
        const db = e.target.result; // 获取IDBDatabase
        db.createObjectStore(TableName.JSLIST, { keyPath: "appName" });
        db.createObjectStore(TableName.CSSLIST, { keyPath: "appName" });
      }
    };
    dbr.onerror = () => {
      reject("没数据");
    };
  });
}
