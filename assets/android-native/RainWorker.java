package com.sabbogota.idiger;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/** Runs every ~15 minutes in the background, even when the app is closed. */
public class RainWorker extends Worker {
    public RainWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            RainChecker.check(getApplicationContext());
        } catch (Exception ignored) {
        }
        return Result.success();
    }
}
