plugins {
    kotlin("jvm") version "2.0.21"
    id("org.jetbrains.intellij") version "1.17.3"
}

group = "com.github.stefandotti"
version = "1.2.0"

repositories {
    mavenCentral()
}

val gsonVersion = "2.11.0"

intellij {
    version.set("2024.3")
    type.set("IC")
    plugins.set(listOf("com.intellij.java"))
}

tasks {
    patchPluginXml {
        sinceBuild.set("252")
        untilBuild.set(null)
    }

    runIde {
        autoReloadPlugins.set(true)
    }
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation("com.google.code.gson:gson:$gsonVersion")
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
