package com.example.BackgroundWorker;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.content.Context;
import androidx.work.PeriodicWorkRequest;
import java.util.Map;

import javax.xml.transform.Result;

import java.util.HashMap;
import androidx.work.Worker;
import androidx.work.WorkerParameters;



public class BackgroundWorker extends Worker {
    private final Context context;

    public BackgroundWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
        this.context = context;
    }
    @NonNull
    @Override
    public Result doWork() {

       Log.w("bg", "Worker do work");

    Bundle extras = bundleExtras();
    Intent service = new Intent(this.context, BackgroundHeadlessTaskService.class);
    service.putExtras(extras);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        createChannel();
        this.context.startForegroundService(service);
    } else {
        this.context.startService(service);
    }
    return Result.success();

    }
}