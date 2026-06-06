package com.micocina.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Capacitor 8 enables edge-to-edge by default (setDecorFitsSystemWindows=false).
        // We override it here so the WebView sits *below* the status bar instead of
        // behind it, letting the native green bar in styles.xml show unobstructed.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
