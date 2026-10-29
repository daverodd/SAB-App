package com.sabbogota.idiger;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Keeps one ongoing (persistent) notification updated with the temperature and
 * humidity of the stations nearest to the last known location.
 */
final class WeatherStatus {
    static final String CHANNEL_ID = "weather-status";
    private static final int NOTIFICATION_ID = 1001;
    private static final String URL_BASE = "https://app.sab.gov.co/sab/ServletTipoSensores?idtiposensor=";

    private WeatherStatus() {}

    static void update(Context ctx, double lat, double lng) throws Exception {
        JSONObject temp = nearestWithReading(URL_BASE + "1", lat, lng);
        JSONObject hum = nearestWithReading(URL_BASE + "2", lat, lng);
        if (temp == null && hum == null) return; // keep whatever is showing

        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        if (!nm.areNotificationsEnabled()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Temperatura y humedad", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Notificación fija con la temperatura y humedad cerca de ti");
            ch.setShowBadge(false);
            ctx.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }

        String tempText = temp != null
            ? String.format(Locale.US, "%.1f °C", temp.optDouble("VALORLECTURA")) : "-- °C";
        String humText = hum != null
            ? String.format(Locale.US, "%d %%", Math.round(hum.optDouble("VALORLECTURA"))) : "-- %";

        String tLoc = temp != null ? prettyLocalidad(temp.optString("LOCALIDAD", "")) : "";
        String hLoc = hum != null ? prettyLocalidad(hum.optString("LOCALIDAD", "")) : "";
        String place;
        if (tLoc.isEmpty()) place = hLoc;
        else if (hLoc.isEmpty() || hLoc.equals(tLoc)) place = tLoc;
        else place = "Temp: " + tLoc + "  |  Humedad: " + hLoc;
        final String detailText = place;

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent pi = PendingIntent.getActivity(
            ctx, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        int icon = ctx.getResources().getIdentifier("ic_stat_temp", "drawable", ctx.getPackageName());

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(icon != 0 ? icon : android.R.drawable.ic_dialog_info)
            .setColor(0xFFDF8B35)
            .setContentTitle(tempText + "  •  Humedad " + humText)
            .setContentText(detailText)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(true)
            .setWhen(System.currentTimeMillis())
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setContentIntent(pi);
        try {
            nm.notify(NOTIFICATION_ID, b.build());
        } catch (SecurityException ignored) {
            // Notification permission not granted.
        }
    }


    private static final String[] LOCALIDADES = {
        "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa",
        "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos", "Teusaquillo",
        "Los Mártires", "Antonio Nariño", "Puente Aranda", "La Candelaria",
        "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"
    };

    /** "ENGATIVA" -> "Engativá" (restores accents for the 20 Bogotá localidades). */
    private static String prettyLocalidad(String raw) {
        String key = stripAccents(raw).trim().toLowerCase(Locale.ROOT);
        if (key.isEmpty()) return "";
        for (String name : LOCALIDADES) {
            if (stripAccents(name).toLowerCase(Locale.ROOT).equals(key)) return name;
        }
        StringBuilder sb = new StringBuilder();
        for (String w : key.split("\\s+")) {
            if (w.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
        }
        return sb.toString();
    }

    private static String stripAccents(String s) {
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
    }

    private static JSONObject nearestWithReading(String url, double lat, double lng) throws Exception {
        JSONArray arr = new JSONObject(RainChecker.httpGet(url)).getJSONArray("TipoSensores");
        JSONObject nearest = null;
        double best = Double.MAX_VALUE;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject s = arr.getJSONObject(i);
            double sLat = s.optDouble("LATITUD", 0);
            double sLng = s.optDouble("LONGITUD", 0);
            double val = s.optDouble("VALORLECTURA", Double.NaN);
            if (Double.isNaN(sLat) || Double.isNaN(sLng) || (sLat == 0 && sLng == 0) || Double.isNaN(val)) continue;
            double d = RainChecker.distance(lat, lng, sLat, sLng);
            if (d < best) {
                best = d;
                nearest = s;
            }
        }
        return nearest;
    }
}
