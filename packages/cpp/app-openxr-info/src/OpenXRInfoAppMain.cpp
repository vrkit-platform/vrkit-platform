#include <openxr/openxr.h>
#include <iostream>
#include <vector>

// Error checking helper
#define CHECK_XR_RESULT(result, message) \
    if (XR_FAILED(result)) { \
        std::cerr << message << ": " << result << std::endl; \
        exit(1); \
    }

int main(int argc, char* argv[]) {
    XrInstance instance;
    XrSystemId systemId;
    XrResult result;

    // Create OpenXR instance
    XrInstanceCreateInfo instanceCreateInfo = { XR_TYPE_INSTANCE_CREATE_INFO };
    strncpy(instanceCreateInfo.applicationInfo.applicationName, "OpenXR App", XR_MAX_APPLICATION_NAME_SIZE);
    instanceCreateInfo.applicationInfo.apiVersion = XR_CURRENT_API_VERSION;
    result = xrCreateInstance(&instanceCreateInfo, &instance);
    CHECK_XR_RESULT(result, "Failed to create OpenXR instance");

    // Get XrSystemId
    XrSystemGetInfo systemInfo = { XR_TYPE_SYSTEM_GET_INFO, nullptr, XR_FORM_FACTOR_HEAD_MOUNTED_DISPLAY };
    result = xrGetSystem(instance, &systemInfo, &systemId);
    CHECK_XR_RESULT(result, "Failed to get OpenXR system");

    // Get system properties
    XrSystemProperties systemProperties = { XR_TYPE_SYSTEM_PROPERTIES };
    result = xrGetSystemProperties(instance, systemId, &systemProperties);
    CHECK_XR_RESULT(result, "Failed to get system properties");

    // Print the recommended and max resolution of the swapchain images
    std::cout << "Recommended Image Rect Width: " << systemProperties.graphicsProperties.maxSwapchainImageWidth << std::endl;
    std::cout << "Recommended Image Rect Height: " << systemProperties.graphicsProperties.maxSwapchainImageHeight << std::endl;
    std::cout << "Max Image Rect Width: " << systemProperties.graphicsProperties.maxSwapchainImageWidth << std::endl;
    std::cout << "Max Image Rect Height: " << systemProperties.graphicsProperties.maxSwapchainImageHeight << std::endl;

    // Cleanup
    xrDestroyInstance(instance);

    return 0;
}