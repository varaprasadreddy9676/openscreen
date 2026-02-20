import { ipcMain as s, screen as j, BrowserWindow as I, desktopCapturer as C, shell as S, app as d, dialog as D, nativeImage as U, Tray as M, Menu as A } from "electron";
import { fileURLToPath as O } from "node:url";
import t from "node:path";
import T from "node:fs/promises";
const P = t.dirname(O(import.meta.url)), z = t.join(P, ".."), w = process.env.VITE_DEV_SERVER_URL, E = t.join(z, "dist");
let m = null;
s.on("hud-overlay-hide", () => {
  m && !m.isDestroyed() && m.minimize();
});
function H() {
  const a = j.getPrimaryDisplay(), { workArea: o } = a, c = 500, u = 100, y = Math.floor(o.x + (o.width - c) / 2), p = Math.floor(o.y + o.height - u - 5), e = new I({
    width: c,
    height: u,
    minWidth: 500,
    maxWidth: 500,
    minHeight: 100,
    maxHeight: 100,
    x: y,
    y: p,
    frame: !1,
    transparent: !0,
    resizable: !1,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    hasShadow: !1,
    webPreferences: {
      preload: t.join(P, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      backgroundThrottling: !1
    }
  });
  return e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), m = e, e.on("closed", () => {
    m === e && (m = null);
  }), w ? e.loadURL(w + "?windowType=hud-overlay") : e.loadFile(t.join(E, "index.html"), {
    query: { windowType: "hud-overlay" }
  }), e;
}
function q() {
  const a = process.platform === "darwin", o = new I({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    ...a && {
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 12, y: 12 }
    },
    transparent: !1,
    resizable: !0,
    alwaysOnTop: !1,
    skipTaskbar: !1,
    title: "OpenScreen",
    backgroundColor: "#000000",
    webPreferences: {
      preload: t.join(P, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      backgroundThrottling: !1
    }
  });
  return o.maximize(), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), w ? o.loadURL(w + "?windowType=editor") : o.loadFile(t.join(E, "index.html"), {
    query: { windowType: "editor" }
  }), o;
}
function B() {
  const { width: a, height: o } = j.getPrimaryDisplay().workAreaSize, c = new I({
    width: 620,
    height: 420,
    minHeight: 350,
    maxHeight: 500,
    x: Math.round((a - 620) / 2),
    y: Math.round((o - 420) / 2),
    frame: !1,
    resizable: !1,
    alwaysOnTop: !0,
    transparent: !0,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: t.join(P, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  });
  return w ? c.loadURL(w + "?windowType=source-selector") : c.loadFile(t.join(E, "index.html"), {
    query: { windowType: "source-selector" }
  }), c;
}
let R = null;
function N(a, o, c, u, y) {
  s.handle("get-sources", async (e, n) => (await C.getSources(n)).map((r) => ({
    id: r.id,
    name: r.name,
    display_id: r.display_id,
    thumbnail: r.thumbnail ? r.thumbnail.toDataURL() : null,
    appIcon: r.appIcon ? r.appIcon.toDataURL() : null
  }))), s.handle("select-source", (e, n) => {
    R = n;
    const i = u();
    return i && i.close(), R;
  }), s.handle("get-selected-source", () => R), s.handle("open-source-selector", () => {
    const e = u();
    if (e) {
      e.focus();
      return;
    }
    o();
  }), s.handle("switch-to-editor", () => {
    const e = c();
    e && e.close(), a();
  }), s.handle("store-recorded-video", async (e, n, i) => {
    try {
      const r = t.join(h, i);
      return await T.writeFile(r, Buffer.from(n)), p = r, {
        success: !0,
        path: r,
        message: "Video stored successfully"
      };
    } catch (r) {
      return console.error("Failed to store video:", r), {
        success: !1,
        message: "Failed to store video",
        error: String(r)
      };
    }
  }), s.handle("get-recorded-video-path", async () => {
    try {
      const n = (await T.readdir(h)).filter((_) => _.endsWith(".webm"));
      if (n.length === 0)
        return { success: !1, message: "No recorded video found" };
      const i = n.sort().reverse()[0];
      return { success: !0, path: t.join(h, i) };
    } catch (e) {
      return console.error("Failed to get video path:", e), { success: !1, message: "Failed to get video path", error: String(e) };
    }
  }), s.handle("set-recording-state", (e, n) => {
    y && y(n, (R || { name: "Screen" }).name);
  }), s.handle("open-external-url", async (e, n) => {
    try {
      return await S.openExternal(n), { success: !0 };
    } catch (i) {
      return console.error("Failed to open URL:", i), { success: !1, error: String(i) };
    }
  }), s.handle("get-asset-base-path", () => {
    try {
      return d.isPackaged ? t.join(process.resourcesPath, "assets") : t.join(d.getAppPath(), "public", "assets");
    } catch (e) {
      return console.error("Failed to resolve asset base path:", e), null;
    }
  }), s.handle("save-exported-video", async (e, n, i) => {
    try {
      const r = i.toLowerCase().endsWith(".gif"), _ = r ? [{ name: "GIF Image", extensions: ["gif"] }] : [{ name: "MP4 Video", extensions: ["mp4"] }], v = await D.showSaveDialog({
        title: r ? "Save Exported GIF" : "Save Exported Video",
        defaultPath: t.join(d.getPath("downloads"), i),
        filters: _,
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      return v.canceled || !v.filePath ? {
        success: !1,
        cancelled: !0,
        message: "Export cancelled"
      } : (await T.writeFile(v.filePath, Buffer.from(n)), {
        success: !0,
        path: v.filePath,
        message: "Video exported successfully"
      });
    } catch (r) {
      return console.error("Failed to save exported video:", r), {
        success: !1,
        message: "Failed to save exported video",
        error: String(r)
      };
    }
  }), s.handle("open-video-file-picker", async () => {
    try {
      const e = await D.showOpenDialog({
        title: "Select Video File",
        defaultPath: h,
        filters: [
          { name: "Video Files", extensions: ["webm", "mp4", "mov", "avi", "mkv"] },
          { name: "All Files", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });
      return e.canceled || e.filePaths.length === 0 ? { success: !1, cancelled: !0 } : {
        success: !0,
        path: e.filePaths[0]
      };
    } catch (e) {
      return console.error("Failed to open file picker:", e), {
        success: !1,
        message: "Failed to open file picker",
        error: String(e)
      };
    }
  }), s.handle("reveal-in-folder", async (e, n) => {
    try {
      return S.showItemInFolder(n), { success: !0 };
    } catch (i) {
      console.error(`Error revealing item in folder: ${n}`, i);
      try {
        const r = await S.openPath(t.dirname(n));
        return r ? { success: !1, error: r } : { success: !0, message: "Could not reveal item, but opened directory." };
      } catch (r) {
        return console.error(`Error opening directory: ${t.dirname(n)}`, r), { success: !1, error: String(i) };
      }
    }
  });
  let p = null;
  s.handle("set-current-video-path", (e, n) => (p = n, { success: !0 })), s.handle("get-current-video-path", () => p ? { success: !0, path: p } : { success: !1 }), s.handle("clear-current-video-path", () => (p = null, { success: !0 })), s.handle("get-platform", () => process.platform);
}
const $ = t.dirname(O(import.meta.url)), h = t.join(d.getPath("userData"), "recordings");
async function G() {
  try {
    await T.mkdir(h, { recursive: !0 }), console.log("RECORDINGS_DIR:", h), console.log("User Data Path:", d.getPath("userData"));
  } catch (a) {
    console.error("Failed to create recordings directory:", a);
  }
}
process.env.APP_ROOT = t.join($, "..");
const Q = process.env.VITE_DEV_SERVER_URL, te = t.join(process.env.APP_ROOT, "dist-electron"), V = t.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Q ? t.join(process.env.APP_ROOT, "public") : V;
let l = null, g = null, f = null, W = "";
const k = L("openscreen.png"), J = L("rec-button.png");
function b() {
  l = H();
}
function x() {
  f = new M(k);
}
function L(a) {
  return U.createFromPath(t.join(process.env.VITE_PUBLIC || V, a)).resize({
    width: 24,
    height: 24,
    quality: "best"
  });
}
function F(a = !1) {
  if (!f) return;
  const o = a ? J : k, c = a ? `Recording: ${W}` : "OpenScreen", u = a ? [
    {
      label: "Stop Recording",
      click: () => {
        l && !l.isDestroyed() && l.webContents.send("stop-recording-from-tray");
      }
    }
  ] : [
    {
      label: "Open",
      click: () => {
        l && !l.isDestroyed() ? l.isMinimized() && l.restore() : b();
      }
    },
    {
      label: "Quit",
      click: () => {
        d.quit();
      }
    }
  ];
  f.setImage(o), f.setToolTip(c), f.setContextMenu(A.buildFromTemplate(u));
}
function K() {
  l && (l.close(), l = null), l = q();
}
function X() {
  return g = B(), g.on("closed", () => {
    g = null;
  }), g;
}
d.on("window-all-closed", () => {
});
d.on("activate", () => {
  I.getAllWindows().length === 0 && b();
});
d.whenReady().then(async () => {
  const { ipcMain: a } = await import("electron");
  a.on("hud-overlay-close", () => {
    d.quit();
  }), x(), F(), await G(), N(
    K,
    X,
    () => l,
    () => g,
    (o, c) => {
      W = c, f || x(), F(o), o || l && l.restore();
    }
  ), b();
});
export {
  te as MAIN_DIST,
  h as RECORDINGS_DIR,
  V as RENDERER_DIST,
  Q as VITE_DEV_SERVER_URL
};
