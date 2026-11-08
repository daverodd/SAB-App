package com.sabbogota.idiger;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Refreshes the temperature/humidity notification (and the rain check) every 5 minutes, on top of the
 * 15-minute WorkManager job (Android doesn't allow periodic work more often than that). Each run books the
 * next one; it restarts after a reboot or app update, and whenever the app is opened.
 */
public class RainAlarm extends BroadcastReceiver {
    static final long INTERVAL_MS = 5 * 60_000L;
    private static final String ACTION = "com.sabbogota.idiger.RAIN_TICK";

    static void schedule(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, RainAlarm.class).setAction(ACTION);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 7, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long at = System.currentTimeMillis() + INTERVAL_MS;
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        final Context ctx = context.getApplicationContext();
        schedule(ctx); // book the next run first, so a failed check never breaks the chain
        final PendingResult done = goAsync();
        new Thread(() -> {
            try {
                RainChecker.check(ctx);
            } catch (Throwable ignored) {
            } finally {
                done.finish();
            }
        }, "sab-rain-tick").start();
    }
}
