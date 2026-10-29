package com.sabbogota.idiger;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RainAlertsPlugin.class);
        super.onCreate(savedInstanceState);
        final View content = findViewById(android.R.id.content);
        content.getRootView().setBackgroundColor(Color.parseColor("#0E111A"));
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
            Insets i = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(i.left, i.top, i.right, i.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
