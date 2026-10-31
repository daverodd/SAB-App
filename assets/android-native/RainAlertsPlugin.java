package com.sabbogota.idiger;

import android.content.Context;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import android.content.SharedPreferences;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.TimeUnit;

/** Bridge between the web app and the background rain checker. */
@CapacitorPlugin(name = "RainAlerts")
public class RainAlertsPlugin extends Plugin {

    @PluginMethod
    public void setLocation(PluginCall call) {
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");
        if (lat == null || lng == null) {
            call.reject("lat and lng are required");
            return;
        }
        getContext()
            .getSharedPreferences(RainChecker.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("lat", String.valueOf(lat))
            .putString("lng", String.valueOf(lng))
            .apply();
        call.resolve();
    }

    /** Schedules the periodic background check (survives closing the app and reboots). */
    @PluginMethod
    public void start(PluginCall call) {
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(RainWorker.class, 15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build();
        WorkManager.getInstance(getContext())
            .enqueueUniquePeriodicWork("rain-alerts", ExistingPeriodicWorkPolicy.KEEP, request);
        call.resolve();
    }

    /** Runs one check right now (used while the app is open). */
    @PluginMethod
    public void checkNow(PluginCall call) {
        final Context ctx = getContext();
        new Thread(() -> {
            RainChecker.check(ctx);
            call.resolve();
        }).start();
    }

    /** Runs a check now and reports what happened (for the "Probar notificaciones" button). */
    @PluginMethod
    public void diagnose(PluginCall call) {
        final Context ctx = getContext();
        new Thread(() -> {
            RainChecker.check(ctx);
            SharedPreferences p = ctx.getSharedPreferences(RainChecker.PREFS, Context.MODE_PRIVATE);
            JSObject o = new JSObject();
            o.put("notificationsEnabled", NotificationManagerCompat.from(ctx).areNotificationsEnabled());
            o.put("lat", p.getString("lat", "none"));
            o.put("lng", p.getString("lng", "none"));
            o.put("time", p.getLong("dbg_time", 0));
            o.put("rain", p.getString("dbg_rain", "never ran (no location saved?)"));
            o.put("weather", p.getString("dbg_weather", "never ran (no location saved?)"));
            call.resolve(o);
        }).start();
    }
}
