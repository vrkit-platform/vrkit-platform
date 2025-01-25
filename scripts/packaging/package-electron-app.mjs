import assert from "assert"
import { build as builder, Platform } from "electron-builder"
import Fs from "fs-extra"
import Path from "path"
import { getOrCreateLogger } from "../setup-env/logger-setup.mjs"
import {
  appDir,
  electronBuilderOutDir,
  ElectronBuilderPaths,
  ElectronBuilderPaths as BuildPaths,
  nativeDir,
  pluginDefaultDir, trackMapsDir,
  xrLayerDir,
  nsisDir
} from "../setup-env/workflow-global.mjs"

export async function packageElectronApp(log = getOrCreateLogger("electron-builder")) {
  /**
   * @type {import("electron-builder").Configuration}
   * @see https://www.electron.build/configuration
   */
  const options = {
    // "store” | “normal” | "maximum". - For testing builds, use 'store' to reduce build time significantly.
    compression: "store",
    removePackageScripts: true,
    
    /**
     * After packing the app, we have to generate
     * the openxr layer file
     *
     * @param context
     * @returns {Promise<void>}
     */
    afterPack: async context => {
      log.info(`afterPack`, context)
      const libName = "vrkit_openxr_lib.dll",
        outDir = Path.join(xrLayerDir, "out"),
        candidates = ["Release", "Debug"]
          .map(targetType => [Path.join(outDir, targetType, libName), `.\\${targetType}\\${libName}`])
          .filter(([libFile]) => Fs.existsSync(libFile)),
        xrArtifactPaths = candidates[0]
      
      assert(Array.isArray(xrArtifactPaths) && xrArtifactPaths.length)
      
      const
        [libFile, resLibFile] = xrArtifactPaths,
        xrLayerJson = {
          "file_format_version" : "1.0.0",
          "api_layer": {
            // `name` is CRITICAL & must match the DLL
            "name": "VRKitOpenXRLayer",
            "library_path": resLibFile,
            "api_version": "1.0",
            "implementation_version": "1",
            "description": "VRKit OpenXR Layer",
            "functions": {
              "xrNegotiateLoaderApiLayerInterface": "VRK_xrNegotiateLoaderApiLayerInterface"
            },
            "disable_environment": "DISABLE_VRKitOpenXRLayer"
          }
        }
      const
        targetOutDir = context.appOutDir,//target.outDir,
        xrResDir = Path.join(targetOutDir, ElectronBuilderPaths.openxrLayer),
        xrLayerJsonFile = Path.join(xrResDir, "openxr-api-layer.json")
      
      Fs.mkdirsSync(xrResDir)
      
      log.info(`OpenXR Layer File: ${xrLayerJsonFile}`)
      Fs.writeJSONSync(xrLayerJsonFile, xrLayerJson)
      
    },
    // afterSign: async (context) => {
    //   // Mac releases require hardening+notarization: https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution
    //   if (!isDebug && context.electronPlatformName === "darwin") {
    //     await notarizeMac(context)
    //   }
    // },
    // artifactBuildStarted: (context) => {
    //   identifyLinuxPackage(context)
    // },
    // afterAllArtifactBuild: (buildResult) => {
    //   return stampArtifacts(buildResult)
    // },
    // force arch build if using electron-rebuild
    beforeBuild: async context => {
      // const { appDir, electronVersion, arch } = context
      // await electronRebuild.rebuild({ buildPath: appDir, electronVersion, arch })
      log.info(`beforeBuild > context`, context)
      return true
    },
    nodeGypRebuild: false,
    buildDependenciesFromSource: false,
    productName: "VRKit",
    appId: "3fv.vrkit.app",
    forceCodeSigning: false,
    directories: {
      output: electronBuilderOutDir,
      buildResources: "resources"
    },
    icon: "resources/icons/icon.ico",
    files: [
      "**/*",
      "resources/icons/**/*",
      "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!**/node_modules/*.d.ts",
      "!**/node_modules/.bin",
      "!**/node_modules/electron",
      "!**/node_modules/@3fv/logger-proxy/node_modules/electron/**/*",
      "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
      "!.editorconfig",
      "!**/._*",
      "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{appveyor.yml,.travis.yml,circle.yml}",
      "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
      "!build/**/*",
      "!lib/**/*",
      "!dist/dev/**/*",
      "!**/src/**/*.ts",
      "!**/src/**/*.tsx"
    ],
    extraFiles: [
      {
        from: Path.join(xrLayerDir, "out"),
        to: BuildPaths.openxrLayer,
        filter: ["**/*"]
      },
      {
        from: Path.relative(appDir, Path.join(nativeDir, "out")),
        to: "resources/native/out",
        filter: ["**/*"]
      },
      {
        from: Path.relative(appDir, trackMapsDir),
        to: "resources/track_maps",
        filter: ["**/*.trackmap"]
      },
      {
        from: Path.relative(appDir, pluginDefaultDir),
        to: "resources/plugins",
        filter: [
          "**/*",
          "!dist/dev/**/*",
          "!src/**/*",
          "!lib/**/*",
          "!esbuild*.js",
          "!tsconfig*",
          "!**/node_modules/**/*"
        ]
      },
      {
        from:  Path.relative(appDir, Path.join(appDir, "resources", "redist")),
        to: "",
        filter: [
          "ucrtbased.dll"
        ]
        
      },
      {
        from:  Path.relative(appDir, Path.join(appDir, "resources", "redist")),
        to: "resources/redist",
        filter: [
          "*.exe",
          "Microsoft.WindowsAppRuntime.Redist.1.6.241114003/WindowsAppSDK-Installer-x64/WindowsAppRuntimeInstall-x64.exe",
        ]
      
      }
    ],

    win: {
      requestedExecutionLevel: "requireAdministrator",
      target: ["nsis"],
    },
    nsis: {
      deleteAppDataOnUninstall: true,
      oneClick: false,
      perMachine: true,
      allowElevation: true,
      allowToChangeInstallationDirectory: true,
      installerHeader: Path.join(nsisDir, "vrkit-nsis-header.bmp"),
      installerSidebar: Path.join(nsisDir, "vrkit-nsis-welcome-finish.bmp"),
      artifactName: "VRKit Platform Installer ${version}.${ext}",
      packElevateHelper: true,
      include: Path.join(nsisDir, "installer.nsh")
      // include: "installer/win/nsis-installer.nsh"
    }
  }

  // Promise is returned
  const result = await builder({
    projectDir: appDir,
    targets: Platform.WINDOWS.createTarget(),
    config: options
  }).catch(err => {
    log.error("Failed to build package", err)
    throw err
  })

  log.info(`Successful build result: ${JSON.stringify(result, null, 2)}`)
  return result
}

export default packageElectronApp
