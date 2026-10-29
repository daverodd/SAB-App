package com.sabbogota.idiger;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Finds the rain station nearest to the last known location and posts a system
 * notification when its status changes to any rain level. Never notifies for
 * "Sin lluvia".
 */
final class RainChecker {
    static final String PREFS = "rain_alerts";
    static final String CHANNEL_ID = "rain-alerts";
    private static final String NO_RAIN = "Sin lluvia";
    private static final String SAB_URL = "https://app.sab.gov.co/sab/ServletTipoSensores?idtiposensor=5";

    private RainChecker() {}

    static synchronized void check(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String latS = p.getString("lat", null);
        String lngS = p.getString("lng", null);
        if (latS == null || lngS == null) return;
        double lat;
        double lng;
        try {
            lat = Double.parseDouble(latS);
            lng = Double.parseDouble(lngS);
        } catch (NumberFormatException e) {
            return;
        }
        try {
            checkRain(ctx, p, lat, lng);
        } catch (Exception ignored) {
            // Network or parsing problem: try again on the next run.
        }
        try {
            WeatherStatus.update(ctx, lat, lng);
        } catch (Exception ignored) {
        }
    }

    private static void checkRain(Context ctx, SharedPreferences p, double lat, double lng) throws Exception {
        JSONArray arr = new JSONObject(httpGet(SAB_URL)).getJSONArray("TipoSensores");
        JSONObject nearest = null;
        double best = Double.MAX_VALUE;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject s = arr.getJSONObject(i);
            double sLat = s.optDouble("LATITUD", 0);
            double sLng = s.optDouble("LONGITUD", 0);
            if (Double.isNaN(sLat) || Double.isNaN(sLng) || (sLat == 0 && sLng == 0)) continue;
            double d = distance(lat, lng, sLat, sLng);
            if (d < best) {
                best = d;
                nearest = s;
            }
        }
        if (nearest == null) return;

        int id = nearest.optInt("IDSENSOR", -1);
        String status = statusFor(nearest);
        int prevId = p.getInt("last_id", -1);
        String prevStatus = p.getString("last_status", null);
        p.edit().putInt("last_id", id).putString("last_status", status).apply();

        // First reading, or the nearest station changed: just remember it.
        if (prevStatus == null || prevId != id) return;
        if (!status.equals(prevStatus) && !status.equals(NO_RAIN)) {
            notifyUser(ctx, status, nearest);
        }
    }

    private static String statusFor(JSONObject s) {
        double now = s.optDouble("VALORLECTURA", 0);
        if (!(now > 0)) return NO_RAIN;
        double acc = s.optDouble("ACUMULADODIA", Double.NaN);
        if (Double.isNaN(acc)) acc = now;
        if (acc <= 10) return "Lluvia leve";
        if (acc <= 30) return "Lluvia moderada";
        if (acc <= 50) return "Lluvia fuerte";
        return "Lluvia muy fuerte";
    }

    private static void notifyUser(Context ctx, String status, JSONObject station) {
        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        if (!nm.areNotificationsEnabled()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Alertas de lluvia", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Aviso cuando empieza a llover cerca de ti");
            ctx.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent pi = PendingIntent.getActivity(
            ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String name = station.optString("ESTACION", "cercana");
        String loc = station.optString("LOCALIDAD", "Bogotá");
        int icon = ctx.getResources().getIdentifier("ic_stat_rain", "drawable", ctx.getPackageName());

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(icon != 0 ? icon : android.R.drawable.ic_dialog_info)
            .setColor(0xFFDF8B35)
            .setContentTitle(status)
            .setContentText("Estación " + name + " (" + loc + ")")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);
        try {
            nm.notify((int) (System.currentTimeMillis() / 1000L), b.build());
        } catch (SecurityException ignored) {
            // Notification permission not granted.
        }
    }

    static String httpGet(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(15000);
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) SAB-Bogota");
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return sb.toString();
        } finally {
            c.disconnect();
        }
    }

    static double distance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
