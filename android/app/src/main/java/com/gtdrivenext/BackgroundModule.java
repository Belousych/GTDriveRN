
package com.gtdrivenext;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.content.Context;
import androidx.work.PeriodicWorkRequest;
import java.util.Map;
import java.util.HashMap;
import androidx.annotation.NonNull;



public class BackgroundModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "BackgroundWorkManager";

    private Context mContext;
    private PeriodicWorkRequest workRequest;

    BackgroundModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
        workRequest = new PeriodicWorkRequest.Builder(BackgroundWorker.class, 20, TimeUnit.MINUTES).build();
    }

    @ReactMethod
    public void startBackgroundWork() {
        WorkManager.getInstance(mContext).enqueueUniquePeriodicWork("testWork", ExistingPeriodicWorkPolicy.KEEP,workRequest);
    }

    @ReactMethod
    public void stopBackgroundWork() {
        WorkManager.getInstance(mContext).cancelUniqueWork("testWork");
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }
}