package com.magiccommons.lambdawaves.webview;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.OutputStream;
import java.util.Collections;

/** P08 proof: λWAVES bundled in assets/www, served over https://appassets.androidplatform.net (a secure context). */
public class MainActivity extends ComponentActivity {
    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    static final String ENTRY = ORIGIN + "/www/probe.html";

    WebView web;
    WebViewAssetLoader assets;
    ValueCallback<Uri[]> pendingFiles;       // one open <input type=file> at a time
    PermissionRequest pendingMic;            // one mic request waiting on the runtime permission

    final ActivityResultLauncher<Intent> pickFile = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), r -> {
                if (pendingFiles != null) pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.getResultCode(), r.getData()));
                pendingFiles = null;
            });

    final ActivityResultLauncher<String> askMic = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), ok -> {
                if (pendingMic == null) return;
                if (ok) pendingMic.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE}); else pendingMic.deny();
                pendingMic = null;
            });

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setDecorFitsSystemWindows(false);     // edge-to-edge
        WebView.setWebContentsDebuggingEnabled(true);      // chrome://inspect can read __LW
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#070A0F"));
        setContentView(web);
        hideBars();

        // /www/<path> -> assets/www/<path>
        WebViewAssetLoader.AssetsPathHandler files = new WebViewAssetLoader.AssetsPathHandler(this);
        assets = new WebViewAssetLoader.Builder().setDomain(HOST).addPathHandler("/www/", p -> files.handle("www/" + p)).build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                return assets.shouldInterceptRequest(req.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl(); String sc = u.getScheme();
                if (HOST.equals(u.getHost())) return false;                        // the bundle stays here
                if ("about".equals(sc) && "about:blank".equals(u.toString())) return false; // probe unloads its frame this way
                if ("http".equals(sc) || "https".equals(sc)) {                         // the wider web -> system browser
                    try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) {}
                }
                return true;                                                          // everything else: blocked
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest req) {
                boolean wantsMic = java.util.Arrays.asList(req.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
                if (!wantsMic || !HOST.equals(req.getOrigin().getHost())) { req.deny(); return; }   // only the mic, only for the bundle
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    req.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                } else {
                    if (pendingMic != null) pendingMic.deny();
                    pendingMic = req; askMic.launch(Manifest.permission.RECORD_AUDIO);
                }
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                        .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "*/*"});  // .json often arrives as octet-stream
                try { pickFile.launch(i); } catch (ActivityNotFoundException e) { pendingFiles = null; return false; }
                return true;
            }
        });

        installSaveBridge();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { if (web.canGoBack()) web.goBack(); else finish(); }
        });

        if (saved == null) web.loadUrl(ENTRY); else web.restoreState(saved);
    }

    void hideBars() {
        WindowInsetsController c = getWindow().getInsetsController();
        if (c == null) return;
        c.hide(WindowInsets.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override public void onWindowFocusChanged(boolean has) { super.onWindowFocusChanged(has); if (has) hideBars(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }

    // ---- downloads: blob: URLs cannot be fetched natively, so the page hands the bytes over (<= 60 lines) ----
    static final String HOOK = "(()=>{if(!window.lwavesAndroid||window.__lwSave)return;"
            + "const save=(u,n)=>fetch(u).then(r=>r.blob()).then(b=>{const f=new FileReader();"
            + "f.onload=()=>lwavesAndroid.saveFile(n||'lambdawaves.bin',String(f.result).split(',')[1]||'');f.readAsDataURL(b)})"
            + ".catch(e=>console.warn('lwavesAndroid save failed',e));window.__lwSave=save;"
            + "const H=HTMLAnchorElement.prototype,c=H.click;"
            + "H.click=function(){if(this.download&&this.href.startsWith('blob:')){save(this.href,this.download);return}return c.call(this)};"
            + "document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[download]');"
            + "if(a&&a.href.startsWith('blob:')){e.preventDefault();save(a.href,a.download)}},true)})();";

    void installSaveBridge() {
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void saveFile(String name, String b64) { writeDownload(name, b64); }  // bridge thread: disk IO off the UI
        }, "lwavesAndroid");
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT))   // every frame, before page scripts: keeps the a.download name
            WebViewCompat.addDocumentStartJavaScript(web, HOOK, Collections.singleton(ORIGIN));
        web.setDownloadListener((url, ua, disposition, mime, len) -> {
            if (url.startsWith("blob:"))                                                 // fallback when the hook is absent: name is guessed
                web.evaluateJavascript(HOOK + "window.__lwSave(" + org.json.JSONObject.quote(url) + ","
                        + org.json.JSONObject.quote(URLUtil.guessFileName(url, disposition, mime)) + ")", null);
            else if (url.startsWith("http"))
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (ActivityNotFoundException ignored) {}
        });
    }

    void writeDownload(String name, String b64) {
        String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        ContentValues v = new ContentValues();
        v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
        v.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        try (OutputStream o = getContentResolver().openOutputStream(u)) {
            o.write(Base64.decode(b64, Base64.DEFAULT));
            v.clear(); v.put(MediaStore.Downloads.IS_PENDING, 0);
            getContentResolver().update(u, v, null, null);
            toast("saved to Downloads: " + safe);
        } catch (Exception e) {
            if (u != null) getContentResolver().delete(u, null, null);
            toast("save failed: " + e.getMessage());
        }
    }

    void toast(String msg) { runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show()); }
}
