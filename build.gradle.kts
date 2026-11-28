// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.kotlin.compose) apply false
  alias(libs.plugins.google.devtools.ksp) apply false
  alias(libs.plugins.secrets) apply false
  alias(libs.plugins.google.services) apply false
}

// Kotlin 1.8.22+ (including 2.2.10) embeds JDK7/JDK8 extensions inside kotlin-stdlib.
// Unify all transitive kotlin-stdlib-jdk7 / kotlin-stdlib-jdk8 artifacts to prevent duplicate class errors.
val unifiedKotlinVersion = libs.versions.kotlin.get()
subprojects {
  configurations.configureEach {
    resolutionStrategy {
      force("org.jetbrains.kotlin:kotlin-stdlib:$unifiedKotlinVersion")
      dependencySubstitution {
        substitute(module("org.jetbrains.kotlin:kotlin-stdlib-jdk7"))
          .using(module("org.jetbrains.kotlin:kotlin-stdlib:$unifiedKotlinVersion"))
        substitute(module("org.jetbrains.kotlin:kotlin-stdlib-jdk8"))
          .using(module("org.jetbrains.kotlin:kotlin-stdlib:$unifiedKotlinVersion"))
      }
    }
  }
}
