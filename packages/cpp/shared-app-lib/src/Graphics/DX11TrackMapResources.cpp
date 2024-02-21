//
// Created by jglanz on 1/7/2024.
//

#include "../resource.h"
#include <IRacingTools/Shared/Graphics/DX11TrackMapResources.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <winrt/base.h>

namespace IRacingTools::Shared::Graphics {

namespace {

struct SimpleVertex {
    [[maybe_unused]] D3DXVECTOR3 Pos;
    [[maybe_unused]] D3DXVECTOR2 Tex;
};

/******************************************************************
 *                                                                 *
 *  Static Data                                                    *
 *                                                                 *
 ******************************************************************/

constexpr WCHAR kHelloWorld[] = L"Hello, World!";

/*static*/
constexpr D3D11_INPUT_ELEMENT_DESC kInputLayout[] = {
    {"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0, D3D11_INPUT_PER_VERTEX_DATA, 0},
    {"TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT, 0, 12, D3D11_INPUT_PER_VERTEX_DATA, 0},
};

/*static*/ static const SimpleVertex kVertexArray[]
    = {{D3DXVECTOR3(-1.0f, -1.0f, 1.0f), D3DXVECTOR2(1.0f, 1.0f)},
       {D3DXVECTOR3(1.0f, -1.0f, 1.0f), D3DXVECTOR2(0.0f, 1.0f)},
       {D3DXVECTOR3(1.0f, 1.0f, 1.0f), D3DXVECTOR2(0.0f, 0.0f)},
       {D3DXVECTOR3(-1.0f, 1.0f, 1.0f), D3DXVECTOR2(1.0f, 0.0f)}};

/*static*/ constexpr SHORT kFacesIndexArray[] = {3, 1, 0, 2, 1, 3};

} // namespace

DX11TrackMapResources::DX11TrackMapResources(DX11DeviceResources *deviceResources) :
    deviceResources_(deviceResources) {}

HRESULT DX11TrackMapResources::render(DWORD dwTimeCur) {
    static float t = 0.0f;
    static DWORD dwTimeStart = 0;

    HRESULT hr = S_OK;
    if (!ready_) {
        winrt::check_hresult(createD3DResources());
        AssertOkMsg(createD3DSizedResources(), "Failed to create 3D sized resources");
        AssertOkMsg(createD2DResources(), "Failed to create 2D resources");
        AssertOkMsg(createDeviceIndependentResources(), "Failed to create device independent resources");
        ready_ = true;
    }

    auto& swapChain = deviceResources_->getSwapChain();
    auto& deviceContext = deviceResources_->getDeviceContext();

    if (dwTimeStart == 0) {
        dwTimeStart = dwTimeCur;
    }
    t = static_cast<float>(dwTimeCur - dwTimeStart) / 3000.0f;

    float a = (t * 360.0f) * (static_cast<float>(D3DX_PI) / 180.0f);
    D3DMatrixRotationY(&worldMatrix_, a);

    // Swap chain will tell us how big the back buffer is
    DXGI_SWAP_CHAIN_DESC swapDesc;
    hr = swapChain->GetDesc(&swapDesc);

    AssertOkMsg(hr, "Got swap chain desc");
    deviceContext->ClearDepthStencilView(deviceResources_->getDepthStencilView().Get(), D3D11_CLEAR_DEPTH, 1, 0);

    // Draw a gradient background before we draw the cube
    if (backBufferRT_) {
        // backBufferRT_->BeginDraw();

        // backBufferGradientBrush_->SetTransform(D2D1::Matrix3x2F::Scale(backBufferRT_->GetSize()));

        // D2D1_RECT_F rect = D2D1::RectF(
        //     0.0f, 0.0f, static_cast<float>(swapDesc.BufferDesc.Width), static_cast<float>(swapDesc.BufferDesc.Height)
        // );

        // backBufferRT_->FillRectangle(&rect, blackBrush_.Get());

        // AssertOkMsg(backBufferRT_->EndDraw(), "Fukk rect");
        // AssertOkMsg(diffuseVariableNoRef_->SetResource(nullptr), "Failed to set diffuseVariable");
        //
        // AssertOkMsg(techniqueNoRef_->GetPassByIndex(0)->Apply(0, deviceContext.Get()), "Failed to call technique");

        // Draw the D2D content into a D3D surface.
        winrt::check_hresult(renderTrackMapIntoSurface());

        // winrt::check_hresult(diffuseVariableNoRef_->SetResource(textureRV_.Get()));
        //
        // // Update variables that change once per frame.
        // winrt::check_hresult(worldVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&worldMatrix_)));
        //
        // // Set the index buffer.
        // deviceContext->IASetIndexBuffer(facesIndexBuffer_.Get(), DXGI_FORMAT_R16_UINT, 0);
        //
        // // Render the scene
        // winrt::check_hresult(techniqueNoRef_->GetPassByIndex(0)->Apply(0, deviceContext.Get()));
        //
        // deviceContext->DrawIndexed(ARRAYSIZE(kFacesIndexArray), 0, 0);

        // Draw some text using a red brush on top of everything
        // if (backBufferRT_) {
        //     backBufferRT_->BeginDraw();
        //     backBufferRT_->SetTransform(D2D1::Matrix3x2F::Identity());
        //
        //     // Text format object will center the text in layout
        //     D2D1_SIZE_F rtSize = backBufferRT_->GetSize();
        //     backBufferRT_->DrawText(
        //         kHelloWorld, ARRAYSIZE(kHelloWorld) - 1, textFormat_.Get(),
        //         D2D1::RectF(0.0f, 0.0f, rtSize.width, rtSize.height),
        //         backBufferTextBrush_.Get());
        //
        //     hr = backBufferRT_->EndDraw();
        // }
        AOK(swapChain->Present(1, 0));
    }
    return hr;
}


HRESULT DX11TrackMapResources::createDeviceIndependentResources() {
    deviceResources_->getOrCreateD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);

    static constexpr WCHAR kFontName[] = L"Verdana";
    static constexpr FLOAT kFontSize = 50;





    // Create D2D factory

    // Create DWrite factory
    winrt::check_hresult(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(dwriteFactory_), &dwriteFactory_));


        // Create DWrite text format object
        winrt::check_hresult(dwriteFactory_->CreateTextFormat(
            kFontName,
            nullptr,
            DWRITE_FONT_WEIGHT_NORMAL,
            DWRITE_FONT_STYLE_NORMAL,
            DWRITE_FONT_STRETCH_NORMAL,
            kFontSize,
            L"", // locale
            &textFormat_
        ));


        // Center the text both horizontally and vertically.
        winrt::check_hresult(textFormat_->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER));
        winrt::check_hresult(textFormat_->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER));



    return S_OK;
}

HRESULT DX11TrackMapResources::createTrackMapResources() {
    std::scoped_lock lock(trackMapMutex_);
    auto trackMapOpt = SharedMemoryStorage::GetInstance()->trackMap();
    if (!trackMapOpt || pathGeometry_) {
        return S_OK;
    }

    auto& trackMap = trackMapOpt.value();
    auto winSize = deviceResources_->getSize();

    auto scaledTrackMap = Geometry::ScaleTrackMapToFit(trackMap, winSize);

    auto &d2dFactory = deviceResources_->getD2DFactory();

    // Create the path geometry.
    winrt::check_hresult(d2dFactory->CreatePathGeometry(pathGeometry_.ReleaseAndGetAddressOf()));

    ComPtr<ID2D1GeometrySink> sink{nullptr};

    // Write to the path geometry using the geometry sink. We are going to
    // create an hour glass.
    winrt::check_hresult(pathGeometry_->Open(&sink));



    sink->SetFillMode(D2D1_FILL_MODE_ALTERNATE);

    for (int idx = 0; idx < scaledTrackMap.points_size(); idx++) {
        auto& point = scaledTrackMap.points(idx);
        auto d2point = D2D1::Point2F(point.x(), point.y());
        if (idx == 0) {
            sink->BeginFigure(d2point, D2D1_FIGURE_BEGIN_FILLED);
        } else {
            sink->AddLine(d2point);
        }
    }
    // sink->AddBezier(D2D1::BezierSegment(D2D1::Point2F(150, 50), D2D1::Point2F(150, 150), D2D1::Point2F(200, 200)));
    //
    // sink->AddLine(D2D1::Point2F(0, 200));
    //
    // sink->AddBezier(D2D1::BezierSegment(D2D1::Point2F(50, 150), D2D1::Point2F(50, 50), D2D1::Point2F(0, 0)));

    sink->EndFigure(D2D1_FIGURE_END_CLOSED);

    winrt::check_hresult(sink->Close());
    return S_OK;
}

HRESULT DX11TrackMapResources::createD3DResources() {
    HRESULT hr = S_OK;
    if (isD3DReady())
        return hr;

    // D3D11_SUBRESOURCE_DATA InitData;
    // auto& device = deviceResources_->getDevice();
    // auto& deviceContext = deviceResources_->getDeviceContext();
    // auto& rasterizerState = deviceResources_->getRasterizerState();
    //
    // //    device->GetImmediateContext(&deviceContext);
    //
    // Allocate a offscreen D3D surface for D2D to render our 2D content into
    // D3D11_TEXTURE2D_DESC texDesc;
    // texDesc.ArraySize = 1;
    // texDesc.BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE;
    // texDesc.CPUAccessFlags = 0;
    // texDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    // texDesc.Height = 512;
    // texDesc.Width = 512;
    // texDesc.MipLevels = 1;
    // texDesc.MiscFlags = 0;
    // texDesc.SampleDesc.Count = 1;
    // texDesc.SampleDesc.Quality = 0;
    // texDesc.Usage = D3D11_USAGE_DEFAULT;
    //
    // hr = device->CreateTexture2D(&texDesc, nullptr, &offscreenTexture_);

    // AssertMsg(SUCCEEDED(hr), "CreateTexture2D offscreen");
    // // Convert the Direct2D texture into a Shader Resource View
    //
    // hr = device->CreateShaderResourceView(offscreenTexture_.Get(), nullptr, textureRV_.ReleaseAndGetAddressOf());
    //
    // AssertMsg(SUCCEEDED(hr), "CreateShaderResourceView");
    // D3D11_BUFFER_DESC bd;
    // bd.Usage = D3D11_USAGE_DEFAULT;
    // bd.ByteWidth = sizeof(kVertexArray);
    // bd.BindFlags = D3D11_BIND_VERTEX_BUFFER;
    // bd.CPUAccessFlags = 0;
    // bd.MiscFlags = 0;
    //
    // InitData.pSysMem = kVertexArray;
    //
    // hr = device->CreateBuffer(&bd, &InitData, &vertexBuffer_);
    // AssertMsg(SUCCEEDED(hr), "create vertex buffer");
    // // Set vertex buffer
    // UINT stride = sizeof(SimpleVertex);
    // UINT offset = 0;
    // ID3D11Buffer *pVertexBuffer = vertexBuffer_.Get();
    //
    // deviceContext->IASetVertexBuffers(
    //     0, // StartSlot
    //     1, // NumBuffers
    //     &pVertexBuffer,
    //     &stride,
    //     &offset
    // );
    //
    // AssertMsg(SUCCEEDED(hr), "");
    //
    // bd.Usage = D3D11_USAGE_DEFAULT;
    // bd.ByteWidth = sizeof(kFacesIndexArray);
    // bd.BindFlags = D3D11_BIND_INDEX_BUFFER;
    // bd.CPUAccessFlags = 0;
    // bd.MiscFlags = 0;
    //
    // InitData.pSysMem = kFacesIndexArray;
    //
    // hr = device->CreateBuffer(&bd, &InitData, &facesIndexBuffer_);
    //
    // // Load pixel shader
    // hr = deviceResources_->createShaderFromMemory(device.Get(), RCDataTrackMapShader, RCDataTrackMapShader_len, &shader_);
    // AssertMsg(SUCCEEDED(hr), "Failed to load shader");
    //
    // // Obtain the technique
    // techniqueNoRef_ = shader_->GetTechniqueByName("Render");
    // hr = techniqueNoRef_ ? S_OK : E_FAIL;
    // AssertMsg(SUCCEEDED(hr), "Failed to find Render technique");
    // // Obtain the variables
    // worldVariableNoRef_ = shader_->GetVariableByName("World")->AsMatrix();
    // hr = worldVariableNoRef_ ? S_OK : E_FAIL;
    // AssertMsg(SUCCEEDED(hr), "Failed to find World technique");
    // viewVariableNoRef_ = shader_->GetVariableByName("View")->AsMatrix();
    // hr = viewVariableNoRef_ ? S_OK : E_FAIL;
    //
    // AssertMsg(SUCCEEDED(hr), "Failed to find View technique");
    // // Initialize the view matrix.
    // D3DXVECTOR3 Eye(0.0f, 2.0f, -6.0f);
    // D3DXVECTOR3 At(0.0f, 0.0f, 0.0f);
    // D3DXVECTOR3 Up(0.0f, 1.0f, 0.0f);
    // D3DMatrixLookAtLH(&viewMatrix_, &Eye, &At, &Up);
    // hr = viewVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&viewMatrix_));
    //
    // AssertMsg(SUCCEEDED(hr), "Failed to set matrix");
    // diffuseVariableNoRef_ = shader_->GetVariableByName("txDiffuse")->AsShaderResource();
    // hr = diffuseVariableNoRef_ ? S_OK : E_FAIL;
    // AssertMsg(SUCCEEDED(hr), "failed to get txDiffuse");
    // projectionVariableNoRef_ = shader_->GetVariableByName("Projection")->AsMatrix();
    // hr = projectionVariableNoRef_ ? S_OK : E_FAIL;
    //
    // AssertMsg(SUCCEEDED(hr), "failed to get projection");
    //
    // // Define the input layout
    // UINT numElements = ARRAYSIZE(kInputLayout);
    //
    // // Create the input layout
    // D3DX11_PASS_DESC PassDesc{};
    // // ZeroMemory(&PassDesc, sizeof(D3DX11_PASS_DESC));
    // AOK(techniqueNoRef_->GetPassByIndex(0)->GetDesc(&PassDesc));
    //
    // AOK(device->CreateInputLayout(
    //     kInputLayout, numElements, PassDesc.pIAInputSignature,
    //     PassDesc.IAInputSignatureSize, &vertexLayout_));
    //
    //
    // // Set the input layout
    // deviceContext->IASetInputLayout(vertexLayout_.Get());
    //

    return hr;
}

bool DX11TrackMapResources::isReady() {
    return ready_;
}

bool DX11TrackMapResources::isD3DReady() {
    return true;
}

HRESULT DX11TrackMapResources::createD3DSizedResources() {
    if (!isD3DReady()) {
        winrt::check_hresult(createD3DResources());
    }
    HRESULT hr = S_OK;

    pathGeometry_.Reset();

    // D3D11_SUBRESOURCE_DATA InitData;
    auto &device = deviceResources_->getDevice();
    auto &deviceContext = deviceResources_->getDeviceContext();
    auto &swapChain = deviceResources_->getSwapChain();
    // auto& rasterizerState = deviceResources_->getRasterizerState();
    auto &d2dFactory = deviceResources_->getOrCreateD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);

    backBufferRT_.Reset();
    deviceResources_->getDepthStencil().Reset();
    deviceResources_->getRenderTargetView().Reset();

    //d2dRenderTarget_->Release();

    ComPtr<IDXGISurface> pBackBuffer{nullptr};
    ComPtr<ID3D11Resource> pBackBufferResource{nullptr};
    // IDXGISurface *pBackBuffer = nullptr;
    // ID3D11Resource *pBackBufferResource = nullptr;
    ID3D11RenderTargetView *viewList[1] = {nullptr};

    // Ensure that nobody is holding onto one of the old resources
    // ID3D11DeviceContext *deviceContext = nullptr;
    // device->GetImmediateContext(&deviceContext);
    deviceContext->OMSetRenderTargets(1, viewList, nullptr);
    auto [width, height] = deviceResources_->getSize();

    // Resize render target buffers
    hr = swapChain->ResizeBuffers(1, width, height, DXGI_FORMAT_B8G8R8A8_UNORM, 0);
    AssertOkMsg(SUCCEEDED(hr), "Swap chain resize failed");

    // Allocate a offscreen D3D surface for D2D to render our 2D content into
    // {
    //     D3D11_TEXTURE2D_DESC texDesc;
    //     texDesc.ArraySize = 1;
    //     texDesc.BindFlags = D3D11_BIND_RENDER_TARGET;
    //     texDesc.CPUAccessFlags = 0;
    //     texDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    //     texDesc.Height = width;
    //     texDesc.Width = height;
    //     texDesc.MipLevels = 1;
    //     texDesc.MiscFlags = 0;
    //     texDesc.SampleDesc.Count = 1;
    //     texDesc.SampleDesc.Quality = 0;
    //     texDesc.Usage = D3D11_USAGE_DEFAULT;
    //
    //     winrt::check_hresult(device->CreateTexture2D(&texDesc, nullptr, &offscreenTexture_));
    //
    //     AssertMsg(SUCCEEDED(hr), "CreateTexture2D offscreen");
    //     // Convert the Direct2D texture into a Shader Resource View
    //
    //     //hr = device->CreateRenderTargetView(offscreenTexture_.Get(), nullptr, textureRV_.ReleaseAndGetAddressOf());
    // }

    D3D11_TEXTURE2D_DESC texDesc;
    texDesc.ArraySize = 1;
    texDesc.BindFlags = D3D11_BIND_DEPTH_STENCIL;
    texDesc.CPUAccessFlags = 0;
    texDesc.Format = DXGI_FORMAT_D16_UNORM;
    texDesc.Height = height;
    texDesc.Width = width;
    texDesc.MipLevels = 1;
    texDesc.MiscFlags = 0;
    texDesc.SampleDesc.Count = 1;
    texDesc.SampleDesc.Quality = 0;
    texDesc.Usage = D3D11_USAGE_DEFAULT;

    hr = device->CreateTexture2D(&texDesc, nullptr, deviceResources_->getDepthStencil().ReleaseAndGetAddressOf());

    AssertOkMsg(hr, "Failed to create depth stencil");
    // Create the render target view and set it on the device
    hr = swapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBufferResource));

    AssertOkMsg(hr, "GetBuffer backBufferResource");

    D3D11_RENDER_TARGET_VIEW_DESC renderDesc;
    renderDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    renderDesc.ViewDimension = D3D11_RTV_DIMENSION_TEXTURE2D;
    renderDesc.Texture2D.MipSlice = 0;

    hr = device->CreateRenderTargetView(
        pBackBufferResource.Get(), &renderDesc, deviceResources_->getRenderTargetView().GetAddressOf()
    );

    AssertOkMsg(hr, "CreateRenderTargetView failed");
    CD3D11_DEPTH_STENCIL_VIEW_DESC depthViewDesc(D3D11_DSV_DIMENSION_TEXTURE2D);

    hr = device->CreateDepthStencilView(
        deviceResources_->getDepthStencil().Get(),
        &depthViewDesc,
        deviceResources_->getDepthStencilView().ReleaseAndGetAddressOf()
    );

    AssertOkMsg(hr, "CreateDepthStencilView failed");
    viewList[0] = deviceResources_->getRenderTargetView().Get();
    deviceContext->OMSetRenderTargets(1, viewList, deviceResources_->getDepthStencilView().Get());

    // Set a new viewport based on the new dimensions
    D3D11_VIEWPORT viewport;
    viewport.Width = static_cast<float>(width);
    viewport.Height = static_cast<float>(height);
    viewport.TopLeftX = 0;
    viewport.TopLeftY = 0;
    viewport.MinDepth = 0;
    viewport.MaxDepth = 1;
    deviceContext->RSSetViewports(1, &viewport);

    // Get a surface in the swap chain
    hr = swapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBuffer));

    AssertOkMsg(hr, "Get back buffer");
    // Reset the projection matrix now that the swapchain is resized.
    D3DMatrixPerspectiveFovLH(
        &projectionMatrix_,
        static_cast<float>(D3DX_PI) * 0.24f,                    // fovy
        static_cast<float>(width) / static_cast<float>(height), // aspect
        0.1f,                                                   // zn
        100.0f                                                  // zf
    );

    // AssertOk(projectionVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&projectionMatrix_)));

    // Create the DXGI Surface Render Target.
    FLOAT dpiX;
    FLOAT dpiY;

    // ReSharper disable once CppDeprecatedEntity
    d2dFactory->GetDesktopDpi(&dpiX, &dpiY);

    D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT, D2D1::PixelFormat(DXGI_FORMAT_UNKNOWN, D2D1_ALPHA_MODE_PREMULTIPLIED), dpiX, dpiY
    );

    // Create a D2D render target which can draw into the surface in the swap
    // chain
    // DXSafeRelease(backBufferRT_);
    winrt::check_hresult(d2dFactory->CreateDxgiSurfaceRenderTarget(pBackBuffer.Get(), &props, backBufferRT_.ReleaseAndGetAddressOf()));
    // DXSafeRelease(&pBackBuffer);
    // DXSafeRelease(&pBackBufferResource);

    return hr;
}
HRESULT DX11TrackMapResources::createD2DResources() {
    HRESULT hr = S_OK;

    auto& d2dFactory = deviceResources_->getOrCreateD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);
    // auto& rt = deviceResources_->getRenderTarget();
    // auto& rtv = deviceResources_->getRenderTargetView();

    // ComPtr<IDXGISurface> pDxgiSurface{nullptr};
    // ComPtr<ID2D1GradientStopCollection> pGradientStops{nullptr};
    //
    // // winrt::check_hresult(offscreenTexture_->QueryInterface(pDxgiSurface.GetAddressOf()));
    // //auto& renderTarget = deviceResources_->getRenderTarget();
    // //winrt::check_hresult(renderTarget->QueryInterface(pDxgiSurface.GetAddressOf()));
    // winrt::check_hresult(backBufferRT_->QueryInterface(pDxgiSurface.GetAddressOf()));
    // // Create a D2D render target which can draw into our offscreen D3D
    // // surface. Given that we use a constant size for the texture, we
    // // fix the DPI at 96.
    D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT, D2D1::PixelFormat(DXGI_FORMAT_UNKNOWN, D2D1_ALPHA_MODE_PREMULTIPLIED), 96, 96
    );
    // DXSafeRelease(&renderTarget_);
    // d2dRenderTarget_ = backBufferRT_;
    // hr = d2dFactory->CreateDxgiSurfaceRenderTarget(pDxgiSurface.Get(), &props, d2dRenderTarget_.ReleaseAndGetAddressOf());
    //
    // AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // // Create a linear gradient brush for the window background
    static constexpr D2D1_GRADIENT_STOP stopsBackground[] = {
        {0.f, {0.f, 0.f, 0.2f, 1.f}}, // Starting with blue
        {1.f, {0.f, 0.f, 0.5f, 1.f}}  // Toward black

    };
    // hr = backBufferRT_->CreateGradientStopCollection(stopsBackground, ARRAYSIZE(stopsBackground), &pGradientStops);

    // AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // hr = backBufferRT_->CreateLinearGradientBrush(
    //     D2D1::LinearGradientBrushProperties(D2D1::Point2F(0.0f, 0.0f), D2D1::Point2F(0.0f, 1.0f)),
    //     pGradientStops.Get(),
    //     &backBufferGradientBrush_
    // );

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // Create a red brush for text drawn into the back buffer
    hr = backBufferRT_->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Red), &backBufferTextBrush_);

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // Create a linear gradient brush for the 2D geometry
    static constexpr D2D1_GRADIENT_STOP stopsGeometry[] = {
        {0.f, {0.f, 1.f, 1.f, 0.25f}}, // Starting with lt.blue
        {1.f, {0.f, 0.f, 1.f, 1.f}},   // Toward blue
    };


    // create a black brush
    hr = backBufferRT_->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Black), &blackBrush_);
    AssertOkMsg(hr, "Create black brush");

    hr = deviceResources_->createBitmapFromMemory(
        backBufferRT_.Get(),
        deviceResources_->getWICFactory().Get(),
        RCDataSampleImage,
        RCDataSampleImage_len,
        1024,
        768,
        &bitmap_
    );


    // DXSafeRelease(&pDxgiSurface);
    // DXSafeRelease(&pGradientStops);

    return hr;
}

HRESULT DX11TrackMapResources::createGridPatternBrush(ID2D1RenderTarget *renderTarget, ID2D1BitmapBrush **ppBitmapBrush) {
    HRESULT hr = S_OK;

    // Create a compatible render target.
    ID2D1BitmapRenderTarget *pCompatibleRenderTarget = nullptr;
    hr = renderTarget->CreateCompatibleRenderTarget(D2D1::SizeF(10.0f, 10.0f), &pCompatibleRenderTarget);
    if (SUCCEEDED(hr)) {
        // Draw a pattern.
        ID2D1SolidColorBrush *pGridBrush = nullptr;
        hr = pCompatibleRenderTarget
                 ->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF(0.93f, 0.94f, 0.96f, 1.0f)), &pGridBrush);
        if (SUCCEEDED(hr)) {
            pCompatibleRenderTarget->BeginDraw();
            pCompatibleRenderTarget->FillRectangle(D2D1::RectF(0.0f, 0.0f, 10.0f, 1.0f), pGridBrush);
            pCompatibleRenderTarget->FillRectangle(D2D1::RectF(0.0f, 0.1f, 1.0f, 10.0f), pGridBrush);
            pCompatibleRenderTarget->EndDraw();

            // Retrieve the bitmap from the render target.
            ID2D1Bitmap *pGridBitmap = nullptr;
            hr = pCompatibleRenderTarget->GetBitmap(&pGridBitmap);
            if (SUCCEEDED(hr)) {
                // Choose the tiling mode for the bitmap brush.
                D2D1_BITMAP_BRUSH_PROPERTIES brushProperties
                    = D2D1::BitmapBrushProperties(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);

                // Create the bitmap brush.
                hr = backBufferRT_->CreateBitmapBrush(pGridBitmap, brushProperties, ppBitmapBrush);

                pGridBitmap->Release();
            }
            pGridBrush->Release();
        }
        pCompatibleRenderTarget->Release();
    }

    return hr;
}
HRESULT DX11TrackMapResources::renderTrackMapIntoSurface() {

    winrt::check_hresult(createTrackMapResources());

    if (!pathGeometry_) {
        // OutputDebugString(L"Track map resources were not created yet");
        return S_OK;
    }

    backBufferRT_->BeginDraw();

    //backBufferRT_->SetTransform(D2D1::Matrix3x2F::Identity());
    //
    backBufferRT_->Clear(D2D1::ColorF(D2D1::ColorF::White));

    backBufferRT_->DrawGeometry(pathGeometry_.Get(), blackBrush_.Get(),3);
    //
    // auto [width, height] = d2dRenderTarget_->GetSize();
    // d2dRenderTarget_->FillRectangle(D2D1::RectF(0.0f, 0.0f, width, height), gridPatternBitmapBrush_.Get());
    //
    // D2D1_SIZE_F size = bitmap_->GetSize();
    //
    // // Set the world transform to a 45 degree rotation at the center of the render
    // // target and write "Hello, World"
    // d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Rotation(45, D2D1::Point2F(width / 2, height / 2)));
    //
    //
    // d2dRenderTarget_->DrawBitmap(bitmap_.Get(), D2D1::RectF(0.0f, 0.0f, size.width, size.height),1, D2D1_BITMAP_INTERPOLATION_MODE_LINEAR);
    //
    // // Draw the bitmap at the bottom corner of the window
    // d2dRenderTarget_->DrawBitmap(bitmap_.Get(), D2D1::RectF(width - size.width, height - size.height, width, height));
    //
    //
    // d2dRenderTarget_->DrawText(
    //     kHelloWorld, ARRAYSIZE(kHelloWorld) - 1, textFormat_.Get(), D2D1::RectF(0, 0, width, height), blackBrush_.Get()
    // );
    //
    // // Reset back to the identity transform
    // d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Translation(0, height - 200));
    //
    // d2dRenderTarget_->FillGeometry(pathGeometry_.Get(), lGBrush_.Get());
    //
    // d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Translation(width - 200, 0));
    //


    HRESULT hr = backBufferRT_->EndDraw();

    return hr;
}

} // namespace IRacingTools::Shared::Graphics
