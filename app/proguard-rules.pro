# ProGuard / R8 Rules for Release Shrinking & Size Optimization
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Preserve Retrofit / Moshi / OkHttp annotations & signatures
-keepattributes Signature,InnerClasses,EnclosingMethod,RuntimeVisibleAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn okhttp3.**
-dontwarn retrofit2.**
