//
// Created by jglanz on 1/7/2024.
//

#include "../resource.h"
#include <..\include\IRacingTools\Shared\Graphics\DX11TrackMapResources.h>
#include <IRacingTools/Shared/Macros.h>

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
[[maybe_unused]] constexpr D3D11_INPUT_ELEMENT_DESC kInputLayout[] = {
    {"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0, D3D11_INPUT_PER_VERTEX_DATA, 0},
    {"TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT, 0, 12, D3D11_INPUT_PER_VERTEX_DATA, 0},
};

/*static*/ const SimpleVertex kVertexArray[]
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
        AssertMsg(SUCCEEDED(createD3DResources()), "Failed to create 3D resources");
        AssertMsg(SUCCEEDED(createD3DSizedResources()), "Failed to create 3D sized resources");
        AssertMsg(SUCCEEDED(createD2DResources()), "Failed to create 2D resources");
        ready_ = true;
    }

    auto swapChain = deviceResources_->getSwapChain();
    auto deviceContext = deviceResources_->getDeviceContext();

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
        backBufferRT_->BeginDraw();

        backBufferGradientBrush_->SetTransform(D2D1::Matrix3x2F::Scale(backBufferRT_->GetSize()));

        D2D1_RECT_F rect = D2D1::RectF(
            0.0f, 0.0f, static_cast<float>(swapDesc.BufferDesc.Width), static_cast<float>(swapDesc.BufferDesc.Height)
        );

        backBufferRT_->FillRectangle(&rect, backBufferGradientBrush_.Get());

        AssertOkMsg(backBufferRT_->EndDraw(), "Fukk rect");
        AssertOkMsg(diffuseVariableNoRef_->SetResource(nullptr), "Failed to set diffuseVariable");
        AssertOkMsg(techniqueNoRef_->GetPassByIndex(0)->Apply(0, deviceContext.Get()), "Failed to call technique");

        // Draw the D2D content into a D3D surface.
        AOK(renderD2DContentIntoSurface());

        AOK(diffuseVariableNoRef_->SetResource(textureRV_.Get()));

        // Update variables that change once per frame.
        AOK(worldVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&worldMatrix_)));

        // Set the index buffer.
        deviceContext->IASetIndexBuffer(facesIndexBuffer_.Get(), DXGI_FORMAT_R16_UINT, 0);

        // Render the scene
        AOK(techniqueNoRef_->GetPassByIndex(0)->Apply(0, deviceContext.Get()));

        deviceContext->DrawIndexed(ARRAYSIZE(kFacesIndexArray), 0, 0);

        // Draw some text using a red brush on top of everything
        if (backBufferRT_) {
            backBufferRT_->BeginDraw();
            backBufferRT_->SetTransform(D2D1::Matrix3x2F::Identity());

            // Text format object will center the text in layout
            // D2D1_SIZE_F rtSize = backBufferRT_->GetSize();
            // backBufferRT_->DrawText(
            //     sc_helloWorld, ARRAYSIZE(sc_helloWorld) - 1, m_pTextFormat,
            //     D2D1::RectF(0.0f, 0.0f, rtSize.width, rtSize.height),
            //     m_pBackBufferTextBrush);
            //
            hr = backBufferRT_->EndDraw();
        }
        AOK(swapChain->Present(1, 0));
    }
    return hr;
}

bool DX11TrackMapResources::isReady() const {
    return ready_;
}

HRESULT DX11TrackMapResources::createD3DResources() {
    HRESULT hr = S_OK;

    D3D11_SUBRESOURCE_DATA InitData;
    auto device = deviceResources_->getDevice();
    auto deviceContext = deviceResources_->getDeviceContext();
    auto rasterizerState = deviceResources_->getRasterizerState();

    //    device->GetImmediateContext(&deviceContext);

    // Allocate a offscreen D3D surface for D2D to render our 2D content into
    D3D11_TEXTURE2D_DESC texDesc;
    texDesc.ArraySize = 1;
    texDesc.BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE;
    texDesc.CPUAccessFlags = 0;
    texDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    texDesc.Height = 512;
    texDesc.Width = 512;
    texDesc.MipLevels = 1;
    texDesc.MiscFlags = 0;
    texDesc.SampleDesc.Count = 1;
    texDesc.SampleDesc.Quality = 0;
    texDesc.Usage = D3D11_USAGE_DEFAULT;

    hr = device->CreateTexture2D(&texDesc, nullptr, &offscreenTexture_);

    AssertMsg(SUCCEEDED(hr), "CreateTexture2D offscreen");
    // Convert the Direct2D texture into a Shader Resource View
    if (textureRV_)
        textureRV_->Release();
    hr = device->CreateShaderResourceView(offscreenTexture_.Get(), nullptr, &textureRV_);

    AssertMsg(SUCCEEDED(hr), "CreateShaderResourceView");
    D3D11_BUFFER_DESC bd;
    bd.Usage = D3D11_USAGE_DEFAULT;
    bd.ByteWidth = sizeof(kVertexArray);
    bd.BindFlags = D3D11_BIND_VERTEX_BUFFER;
    bd.CPUAccessFlags = 0;
    bd.MiscFlags = 0;

    InitData.pSysMem = kVertexArray;

    hr = device->CreateBuffer(&bd, &InitData, &vertexBuffer_);
    AssertMsg(SUCCEEDED(hr), "create vertex buffer");
    // Set vertex buffer
    UINT stride = sizeof(SimpleVertex);
    UINT offset = 0;
    ID3D11Buffer *pVertexBuffer = vertexBuffer_.Get();

    deviceContext->IASetVertexBuffers(
        0, // StartSlot
        1, // NumBuffers
        &pVertexBuffer,
        &stride,
        &offset
    );

    AssertMsg(SUCCEEDED(hr), "");

    bd.Usage = D3D11_USAGE_DEFAULT;
    bd.ByteWidth = sizeof(kFacesIndexArray);
    bd.BindFlags = D3D11_BIND_INDEX_BUFFER;
    bd.CPUAccessFlags = 0;
    bd.MiscFlags = 0;

    InitData.pSysMem = kFacesIndexArray;

    hr = device->CreateBuffer(&bd, &InitData, &facesIndexBuffer_);

    // Load pixel shader
    hr = deviceResources_->createShaderFromMemory(device.Get(), RCDataTrackMapShader, RCDataTrackMapShader_len, &shader_);
    AssertMsg(SUCCEEDED(hr), "Failed to load shader");

    // Obtain the technique
    techniqueNoRef_ = shader_->GetTechniqueByName("Render2");
    hr = techniqueNoRef_ ? S_OK : E_FAIL;
    AssertMsg(SUCCEEDED(hr), "Failed to find Render technique");
    // Obtain the variables
    worldVariableNoRef_ = shader_->GetVariableByName("World")->AsMatrix();
    hr = worldVariableNoRef_ ? S_OK : E_FAIL;
    AssertMsg(SUCCEEDED(hr), "Failed to find World technique");
    viewVariableNoRef_ = shader_->GetVariableByName("View")->AsMatrix();
    hr = viewVariableNoRef_ ? S_OK : E_FAIL;

    AssertMsg(SUCCEEDED(hr), "Failed to find View technique");
    // Initialize the view matrix.
    D3DXVECTOR3 Eye(0.0f, 2.0f, -6.0f);
    D3DXVECTOR3 At(0.0f, 0.0f, 0.0f);
    D3DXVECTOR3 Up(0.0f, 1.0f, 0.0f);
    D3DMatrixLookAtLH(&viewMatrix_, &Eye, &At, &Up);
    hr = viewVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&viewMatrix_));

    AssertMsg(SUCCEEDED(hr), "Failed to set matrix");
    diffuseVariableNoRef_ = shader_->GetVariableByName("txDiffuse")->AsShaderResource();
    hr = diffuseVariableNoRef_ ? S_OK : E_FAIL;
    AssertMsg(SUCCEEDED(hr), "failed to get txDiffuse");
    projectionVariableNoRef_ = shader_->GetVariableByName("Projection")->AsMatrix();
    hr = projectionVariableNoRef_ ? S_OK : E_FAIL;

    AssertMsg(SUCCEEDED(hr), "failed to get projection");
    ready_ = true;
    return hr;
}

HRESULT DX11TrackMapResources::createD3DSizedResources() {
    HRESULT hr = S_OK;

    // D3D11_SUBRESOURCE_DATA InitData;
    auto &device = deviceResources_->getDevice();
    auto &deviceContext = deviceResources_->getDeviceContext();
    auto &swapChain = deviceResources_->getSwapChain();
    // auto& rasterizerState = deviceResources_->getRasterizerState();
    auto &d2dFactory = deviceResources_->getOrCreateD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);

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
        pBackBufferResource.Get(), &renderDesc, deviceResources_->getRenderTargetView().ReleaseAndGetAddressOf()
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

    AOK(projectionVariableNoRef_->SetMatrix(reinterpret_cast<float *>(&projectionMatrix_)));

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
    hr = d2dFactory->CreateDxgiSurfaceRenderTarget(pBackBuffer.Get(), &props, backBufferRT_.ReleaseAndGetAddressOf());
    // DXSafeRelease(&pBackBuffer);
    // DXSafeRelease(&pBackBufferResource);

    return hr;
}
HRESULT DX11TrackMapResources::createD2DResources() {
    HRESULT hr = S_OK;

    auto d2dFactory = deviceResources_->getOrCreateD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);

    ComPtr<IDXGISurface> pDxgiSurface{nullptr};
    ComPtr<ID2D1GradientStopCollection> pGradientStops{nullptr};

    hr = offscreenTexture_->QueryInterface(pDxgiSurface.GetAddressOf());
    AssertOkMsg(hr, "offscreenTexture_->QueryInterface(&pDxgiSurface)");
    // Create a D2D render target which can draw into our offscreen D3D
    // surface. Given that we use a constant size for the texture, we
    // fix the DPI at 96.
    D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT, D2D1::PixelFormat(DXGI_FORMAT_UNKNOWN, D2D1_ALPHA_MODE_PREMULTIPLIED), 96, 96
    );
    // DXSafeRelease(&renderTarget_);
    hr = d2dFactory->CreateDxgiSurfaceRenderTarget(pDxgiSurface.Get(), &props, d2dRenderTarget_.ReleaseAndGetAddressOf());

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // Create a linear gradient brush for the window background
    static constexpr D2D1_GRADIENT_STOP stopsBackground[] = {
        {0.f, {0.f, 0.f, 0.2f, 1.f}}, // Starting with blue
        {1.f, {0.f, 0.f, 0.5f, 1.f}}  // Toward black

    };
    hr = d2dRenderTarget_->CreateGradientStopCollection(stopsBackground, ARRAYSIZE(stopsBackground), &pGradientStops);

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    hr = backBufferRT_->CreateLinearGradientBrush(
        D2D1::LinearGradientBrushProperties(D2D1::Point2F(0.0f, 0.0f), D2D1::Point2F(0.0f, 1.0f)),
        pGradientStops.Get(),
        &backBufferGradientBrush_
    );

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // Create a red brush for text drawn into the back buffer
    hr = d2dRenderTarget_->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Red), &backBufferTextBrush_);

    AssertOkMsg(hr, "CreateDxgiSurfaceRenderTarget");
    // Create a linear gradient brush for the 2D geometry
    static constexpr D2D1_GRADIENT_STOP stopsGeometry[] = {
        {0.f, {0.f, 1.f, 1.f, 0.25f}}, // Starting with lt.blue
        {1.f, {0.f, 0.f, 1.f, 1.f}},   // Toward blue
    };

    hr = d2dRenderTarget_->CreateGradientStopCollection(
        stopsGeometry, ARRAYSIZE(stopsGeometry), pGradientStops.ReleaseAndGetAddressOf()
    );
    AssertOkMsg(hr, "CreateGradientStopCollection");
    hr = d2dRenderTarget_->CreateLinearGradientBrush(
        D2D1::LinearGradientBrushProperties(D2D1::Point2F(100, 0), D2D1::Point2F(100, 200)),
        D2D1::BrushProperties(),
        pGradientStops.Get(),
        &lGBrush_
    );

    AssertOkMsg(hr, "CreateLinearGradientBrush");

    // create a black brush
    hr = d2dRenderTarget_->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Black), &blackBrush_);
    AssertOkMsg(hr, "Create black brush");

    hr = deviceResources_->createBitmapFromMemory(
        d2dRenderTarget_.Get(),
        deviceResources_->getWICFactory().Get(),
        RCDataSampleImage,
        RCDataSampleImage_len,
        100,
        0,
        &bitmap_
    );

    if (SUCCEEDED(hr)) {
        hr = createGridPatternBrush(d2dRenderTarget_.Get(), &gridPatternBitmapBrush_);
        if (SUCCEEDED(hr)) {
            gridPatternBitmapBrush_->SetOpacity(0.5f);
        }
    }

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
                hr = d2dRenderTarget_->CreateBitmapBrush(pGridBitmap, brushProperties, ppBitmapBrush);

                pGridBitmap->Release();
            }
            pGridBrush->Release();
        }
        pCompatibleRenderTarget->Release();
    }

    return hr;
}
HRESULT DX11TrackMapResources::renderD2DContentIntoSurface() {
    d2dRenderTarget_->BeginDraw();

    d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Identity());

    d2dRenderTarget_->Clear(D2D1::ColorF(D2D1::ColorF::White));

    auto [width, height] = d2dRenderTarget_->GetSize();
    d2dRenderTarget_->FillRectangle(D2D1::RectF(0.0f, 0.0f, width, height), gridPatternBitmapBrush_.Get());

    D2D1_SIZE_F size = bitmap_->GetSize();

    d2dRenderTarget_->DrawBitmap(bitmap_.Get(), D2D1::RectF(0.0f, 0.0f, size.width, size.height));

    // Draw the bitmap at the bottom corner of the window
    d2dRenderTarget_->DrawBitmap(bitmap_.Get(), D2D1::RectF(width - size.width, height - size.height, width, height));

    // Set the world transform to a 45 degree rotation at the center of the render
    // target and write "Hello, World"
    d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Rotation(45, D2D1::Point2F(width / 2, height / 2)));

    // d2dRenderTarget_->DrawText(
    //     kHelloWorld, ARRAYSIZE(kHelloWorld) - 1, m_pTextFormat, D2D1::RectF(0, 0, width, height), m_pBlackBrush
    // );
    //
    // // Reset back to the identity transform d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Translation(0, height - 200));
    //
    // d2dRenderTarget_->FillGeometry(pathGeometry_.Get(), lGBrush_.Get());
    //
    // d2dRenderTarget_->SetTransform(D2D1::Matrix3x2F::Translation(width - 200, 0));
    //
    // d2dRenderTarget_->FillGeometry(pathGeometry_.Get(), lGBrush_.Get());

    HRESULT hr = d2dRenderTarget_->EndDraw();

    return hr;
}

} // namespace IRacingTools::Shared::Graphics
