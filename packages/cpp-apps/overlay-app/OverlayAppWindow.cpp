//
// Created by jglanz on 1/5/2024.
//

#include "OverlayAppWindow.h"
#include "resource.h"

#include <IRacingTools/Shared/Macros.h>
#include <cassert>

/******************************************************************
 *                                                                 *
 *  Static Data                                                    *
 *                                                                 *
 ******************************************************************/

/*static*/ const D3D11_INPUT_ELEMENT_DESC OverlayApp::s_InputLayout[] = {
    {"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0,
     D3D11_INPUT_PER_VERTEX_DATA, 0},
    {"TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT, 0, 12,
     D3D11_INPUT_PER_VERTEX_DATA, 0},
};

/*static*/ const SimpleVertex OverlayApp::s_VertexArray[] = {
    {D3DXVECTOR3(-1.0f, -1.0f, 1.0f), D3DXVECTOR2(1.0f, 1.0f)},
    {D3DXVECTOR3(1.0f, -1.0f, 1.0f), D3DXVECTOR2(0.0f, 1.0f)},
    {D3DXVECTOR3(1.0f, 1.0f, 1.0f), D3DXVECTOR2(0.0f, 0.0f)},
    {D3DXVECTOR3(-1.0f, 1.0f, 1.0f), D3DXVECTOR2(1.0f, 0.0f)}};

/*static*/ const SHORT OverlayApp::s_FacesIndexArray[] = {3, 1, 0, 2, 1, 3};

static const WCHAR sc_helloWorld[] = L"Hello, World!";

/******************************************************************
 *                                                                 *
 *  OverlayApp::OverlayApp                                   *
 *                                                                 *
 *  Constructor -- initialize member data                          *
 *                                                                 *
 ******************************************************************/

OverlayApp::OverlayApp()
    : m_hwnd(nullptr), m_pD2DFactory(nullptr), m_pWICFactory(nullptr),
      m_pDWriteFactory(nullptr), m_pDevice(nullptr), m_pSwapChain(nullptr),
      m_pRenderTargetView(nullptr), m_pState(nullptr), m_pDepthStencil(nullptr),
      m_pDepthStencilView(nullptr), m_pOffscreenTexture(nullptr), m_pShader(nullptr),
      m_pVertexBuffer(nullptr), m_pVertexLayout(nullptr), m_pFacesIndexBuffer(nullptr),
      m_pTextureRV(nullptr), m_pBackBufferRT(nullptr), m_pBackBufferTextBrush(nullptr),
      m_pBackBufferGradientBrush(nullptr), m_pGridPatternBitmapBrush(nullptr),
      m_pRenderTarget(nullptr), m_pLGBrush(nullptr), m_pBlackBrush(nullptr),
      m_pBitmap(nullptr), m_pTechniqueNoRef(nullptr), m_pWorldVariableNoRef(nullptr),
      m_pViewVariableNoRef(nullptr), m_pProjectionVariableNoRef(nullptr),
      m_pDiffuseVariableNoRef(nullptr), m_pTextFormat(nullptr),
      m_pPathGeometry(nullptr) {}

/******************************************************************
 *                                                                 *
 *  OverlayApp::~OverlayApp                                  *
 *                                                                 *
 *  Destructor -- tear down member data                            *
 *                                                                 *
 ******************************************************************/

OverlayApp::~OverlayApp() {
  DXSafeRelease(&m_pD2DFactory);
  DXSafeRelease(&m_pWICFactory);
  DXSafeRelease(&m_pDWriteFactory);

  DXSafeRelease(&m_pDevice);
  DXSafeRelease(&m_pSwapChain);
  DXSafeRelease(&m_pRenderTargetView);
  DXSafeRelease(&m_pState);
  DXSafeRelease(&m_pDepthStencil);
  DXSafeRelease(&m_pDepthStencilView);
  DXSafeRelease(&m_pOffscreenTexture);
  DXSafeRelease(&m_pShader);
  DXSafeRelease(&m_pVertexBuffer);
  DXSafeRelease(&m_pVertexLayout);
  DXSafeRelease(&m_pFacesIndexBuffer);
  DXSafeRelease(&m_pTextureRV);
  DXSafeRelease(&m_pBackBufferRT);
  DXSafeRelease(&m_pBackBufferTextBrush);
  DXSafeRelease(&m_pBackBufferGradientBrush);
  DXSafeRelease(&m_pGridPatternBitmapBrush);
  DXSafeRelease(&m_pRenderTarget);
  DXSafeRelease(&m_pLGBrush);
  DXSafeRelease(&m_pBlackBrush);
  DXSafeRelease(&m_pBitmap);
  DXSafeRelease(&m_pTextFormat);
  DXSafeRelease(&m_pPathGeometry);
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::Initialize                                      *
 *                                                                 *
 *  Create application window and device-independent resources     *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::Initialize() {
  HRESULT hr;

  hr = CreateDeviceIndependentResources();
  if (SUCCEEDED(hr)) {
    // Register the window class.
    WNDCLASSEX wcex = {sizeof(WNDCLASSEX)};
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = OverlayApp::WndProc;
    wcex.cbClsExtra = 0;
    wcex.cbWndExtra = sizeof(LONG_PTR);
    wcex.hInstance = HINST_THISCOMPONENT;
    wcex.hbrBackground = nullptr;
    wcex.lpszMenuName = nullptr;
    wcex.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wcex.lpszClassName = L"D2DDXGISampleApp";

    RegisterClassEx(&wcex);

    // Create the application window.
    //
    // Because the CreateWindow function takes its size in pixels, we
    // obtain the system DPI and use it to scale the window size.
    FLOAT dpiX, dpiY;
    m_pD2DFactory->GetDesktopDpi(&dpiX, &dpiY);

    m_hwnd = CreateWindow(L"D2DDXGISampleApp", L"Direct2D Demo App",
                          WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT,
                          static_cast<UINT>(ceil(640.f * dpiX / 96.f)),
                          static_cast<UINT>(ceil(480.f * dpiY / 96.f)), NULL,
                          NULL, HINST_THISCOMPONENT, this);

    hr = m_hwnd ? S_OK : E_FAIL;
    if (SUCCEEDED(hr)) {
      // Create a timer and receive WM_TIMER messages at a rough
      // granularity of 33msecs. If you need a more precise timer,
      // consider modifying the message loop and calling more precise
      // timing functions.
      SetTimer(m_hwnd,
               0,   // timerId
               33,  // msecs
               nullptr // lpTimerProc
      );

      ShowWindow(m_hwnd, SW_SHOWNORMAL);

      UpdateWindow(m_hwnd);
    }
  }

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::CreateDeviceIndependentResources                *
 *                                                                 *
 *  This method is used to create resources which are not bound    *
 *  to any device. Their lifetime effectively extends for the      *
 *  duration of the app. These resources include the D2D,          *
 *  DWrite, and WIC factories; and a DWrite Text Format object     *
 *  (used for identifying particular font characteristics) and     *
 *  a D2D geometry.                                                *
 *                                                                 *
 ******************************************************************/

HRESULT OverlayApp::CreateDeviceIndependentResources() {
  static const WCHAR msc_fontName[] = L"Verdana";
  static const FLOAT msc_fontSize = 50;
  ID2D1GeometrySink *pSink = nullptr;
  HRESULT hr;

  // Create D2D factory
  hr = D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, &m_pD2DFactory);
  if (SUCCEEDED(hr)) {
    // Create a WIC factory
    hr = CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER,
                          IID_IWICImagingFactory,
                          reinterpret_cast<void **>(&m_pWICFactory));
  }
  if (SUCCEEDED(hr)) {
    // Create DWrite factory
    hr = DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED,
                             __uuidof(m_pDWriteFactory),
                             reinterpret_cast<IUnknown **>(&m_pDWriteFactory));
  }
  if (SUCCEEDED(hr)) {
    // Create DWrite text format object
    hr = m_pDWriteFactory->CreateTextFormat(
        msc_fontName, nullptr, DWRITE_FONT_WEIGHT_NORMAL, DWRITE_FONT_STYLE_NORMAL,
        DWRITE_FONT_STRETCH_NORMAL, msc_fontSize,
        L"", // locale
        &m_pTextFormat);
  }
  if (SUCCEEDED(hr)) {
    // Center the text both horizontally and vertically.
    m_pTextFormat->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
    m_pTextFormat->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);

    // Create the path geometry.
    hr = m_pD2DFactory->CreatePathGeometry(&m_pPathGeometry);
  }
  if (SUCCEEDED(hr)) {
    // Write to the path geometry using the geometry sink. We are going to
    // create an hour glass.
    hr = m_pPathGeometry->Open(&pSink);
  }
  if (SUCCEEDED(hr)) {
    pSink->SetFillMode(D2D1_FILL_MODE_ALTERNATE);

    pSink->BeginFigure(D2D1::Point2F(0, 0), D2D1_FIGURE_BEGIN_FILLED);

    pSink->AddLine(D2D1::Point2F(200, 0));

    pSink->AddBezier(D2D1::BezierSegment(D2D1::Point2F(150, 50),
                                         D2D1::Point2F(150, 150),
                                         D2D1::Point2F(200, 200)));

    pSink->AddLine(D2D1::Point2F(0, 200));

    pSink->AddBezier(D2D1::BezierSegment(
        D2D1::Point2F(50, 150), D2D1::Point2F(50, 50), D2D1::Point2F(0, 0)));

    pSink->EndFigure(D2D1_FIGURE_END_CLOSED);

    hr = pSink->Close();
  }

  DXSafeRelease(&pSink);

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::CreateDeviceResources                           *
 *                                                                 *
 *  This method is responsible for creating the D3D device and     *
 *  all corresponding device-bound resources that are required to  *
 *  render.                                                        *
 *                                                                 *
 *  Of the objects created in this method, 5 are interesting ...   *
 *                                                                 *
 *     1. D3D Device (m_pDevice) -- This device must support 32bpp *
 *           BGRA                                                  *
 *                                                                 *
 *     2. DXGI Swap Chain (m_pSwapChain) -- Mapped to current      *
 *           window (m_hwnd)                                       *
 *                                                                 *
 *     3. D2D Surface Render Target (m_pBackBufferRT) -- Allows    *
 *           us to use D2D to draw directly into a swap chain      *
 *           buffer, in order to show (for example) a background   *
 *           gradient.                                             *
 *                                                                 *
 *     4. D3D Offscreen Texture (m_pOffscreenTexture) -- Texture   *
 *           which is mapped to our 3D model.                      *
 *                                                                 *
 *     5. D2D Surface Render Target (m_pRenderTarget) -- Allows us *
 *           to use D2D to draw into the (4) D3D offscreen         *
 *           texture. This texture will then be mapped and         *
 *           displayed on our 3D model.                            *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::CreateDeviceResources() {
  HRESULT hr = S_OK;
  RECT rcClient;
  ID3D11Device *pDevice = nullptr;

  IDXGIDevice *pDXGIDevice = nullptr;
  IDXGIAdapter *pAdapter = nullptr;
  IDXGIFactory *pDXGIFactory = nullptr;
  IDXGISurface *pSurface = nullptr;

  Assert(m_hwnd);

  GetClientRect(m_hwnd, &rcClient);

  UINT nWidth = abs(rcClient.right - rcClient.left);
  UINT nHeight = abs(rcClient.bottom - rcClient.top);

  // If we don't have a device, need to create one now and all
  // accompanying D3D resources.
  if (!m_pDevice) {

    UINT nDeviceFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
    // Create device
    hr = CreateD3DDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nDeviceFlags,
                         &pDevice);

    if (FAILED(hr)) {
      hr =
          CreateD3DDevice(nullptr, D3D_DRIVER_TYPE_WARP, nDeviceFlags, &pDevice);
    }

    if (SUCCEEDED(hr)) {
      hr = pDevice->QueryInterface(&m_pDevice);
    }


    if (SUCCEEDED(hr)) {
      hr = pDevice->QueryInterface(&pDXGIDevice);
    }
    if (SUCCEEDED(hr)) {
      hr = pDXGIDevice->GetAdapter(&pAdapter);
    }
    if (SUCCEEDED(hr)) {
      hr = pAdapter->GetParent(IID_PPV_ARGS(&pDXGIFactory));
    }
    if (SUCCEEDED(hr)) {
      DXGI_SWAP_CHAIN_DESC swapDesc;
      ::ZeroMemory(&swapDesc, sizeof(swapDesc));

      swapDesc.BufferDesc.Width = nWidth;
      swapDesc.BufferDesc.Height = nHeight;
      swapDesc.BufferDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
      swapDesc.BufferDesc.RefreshRate.Numerator = 60;
      swapDesc.BufferDesc.RefreshRate.Denominator = 1;
      swapDesc.SampleDesc.Count = 1;
      swapDesc.SampleDesc.Quality = 0;
      swapDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
      swapDesc.BufferCount = 1;
      swapDesc.OutputWindow = m_hwnd;
      swapDesc.Windowed = TRUE;

      hr = pDXGIFactory->CreateSwapChain(m_pDevice, &swapDesc, &m_pSwapChain);
    }

    if (SUCCEEDED(hr)) {
      hr = CreateD3DDeviceResources();
    }
    if (SUCCEEDED(hr)) {
      hr = RecreateSizedResources(nWidth, nHeight);
    }
    if (SUCCEEDED(hr)) {
      hr = CreateD2DDeviceResources();
    }
  }

  //DXSafeRelease(&pDeviceContext);
  DXSafeRelease(&pDevice);
  DXSafeRelease(&pDXGIDevice);
  DXSafeRelease(&pAdapter);
  DXSafeRelease(&pDXGIFactory);
  DXSafeRelease(&pSurface);

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::RecreateSizedResources                          *
 *                                                                 *
 *  This method is responsible for (re)creating all device         *
 *  resources that depend on the window size.                      *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::RecreateSizedResources(UINT nWidth, UINT nHeight) {
  HRESULT hr = S_OK;
  IDXGISurface *pBackBuffer = nullptr;
  ID3D11Resource *pBackBufferResource = nullptr;
  ID3D11RenderTargetView *viewList[1] = {nullptr};

  // Ensure that nobody is holding onto one of the old resources
  DXSafeRelease(&m_pBackBufferRT);
  DXSafeRelease(&m_pRenderTargetView);

  ID3D11DeviceContext *deviceContext = nullptr;
  m_pDevice->GetImmediateContext(&deviceContext);
  deviceContext->OMSetRenderTargets(1, viewList, nullptr);

  // Resize render target buffers
  hr = m_pSwapChain->ResizeBuffers(1, nWidth, nHeight,
                                   DXGI_FORMAT_B8G8R8A8_UNORM, 0);

  if (SUCCEEDED(hr)) {
    D3D11_TEXTURE2D_DESC texDesc;
    texDesc.ArraySize = 1;
    texDesc.BindFlags = D3D11_BIND_DEPTH_STENCIL;
    texDesc.CPUAccessFlags = 0;
    texDesc.Format = DXGI_FORMAT_D16_UNORM;
    texDesc.Height = nHeight;
    texDesc.Width = nWidth;
    texDesc.MipLevels = 1;
    texDesc.MiscFlags = 0;
    texDesc.SampleDesc.Count = 1;
    texDesc.SampleDesc.Quality = 0;
    texDesc.Usage = D3D11_USAGE_DEFAULT;

    DXSafeRelease(&m_pDepthStencil);
    hr = m_pDevice->CreateTexture2D(&texDesc, nullptr, &m_pDepthStencil);
  }

  if (SUCCEEDED(hr)) {
    // Create the render target view and set it on the device
    hr = m_pSwapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBufferResource));
  }
  if (SUCCEEDED(hr)) {
    D3D11_RENDER_TARGET_VIEW_DESC renderDesc;
    renderDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    renderDesc.ViewDimension = D3D11_RTV_DIMENSION_TEXTURE2D;
    renderDesc.Texture2D.MipSlice = 0;

    DXSafeRelease(&m_pRenderTargetView);
    hr = m_pDevice->CreateRenderTargetView(pBackBufferResource, &renderDesc,
                                           &m_pRenderTargetView);
  }
  if (SUCCEEDED(hr)) {
    CD3D11_DEPTH_STENCIL_VIEW_DESC depthViewDesc(
      D3D11_DSV_DIMENSION_TEXTURE2D
      );
    // depthViewDesc.Format = DXGI_FORMAT_D16_UNORM;
    // depthViewDesc.ViewDimension = D3D11_DSV_DIMENSION_TEXTURE2D;
    // depthViewDesc.Texture2D.MipSlice = 0;

    DXSafeRelease(&m_pDepthStencilView);
    hr = m_pDevice->CreateDepthStencilView(m_pDepthStencil, &depthViewDesc,
                                           &m_pDepthStencilView);
  }
  if (SUCCEEDED(hr)) {
    viewList[0] = m_pRenderTargetView;
    deviceContext->OMSetRenderTargets(1, viewList, m_pDepthStencilView);

    // Set a new viewport based on the new dimensions
    D3D11_VIEWPORT viewport;
    viewport.Width = nWidth;
    viewport.Height = nHeight;
    viewport.TopLeftX = 0;
    viewport.TopLeftY = 0;
    viewport.MinDepth = 0;
    viewport.MaxDepth = 1;
    deviceContext->RSSetViewports(1, &viewport);

    // Get a surface in the swap chain
    hr = m_pSwapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBuffer));
  }

  if (SUCCEEDED(hr)) {
    // Reset the projection matrix now that the swapchain is resized.
    D3DMatrixPerspectiveFovLH(&m_ProjectionMatrix,
                              (float)D3DX_PI * 0.24f,  // fovy
                              nWidth / (float)nHeight, // aspect
                              0.1f,                    // zn
                              100.0f                   // zf
    );

    m_pProjectionVariableNoRef->SetMatrix((float *)&m_ProjectionMatrix);

    // Create the DXGI Surface Render Target.
    FLOAT dpiX;
    FLOAT dpiY;

    m_pD2DFactory->GetDesktopDpi(&dpiX, &dpiY);

    D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT,
        D2D1::PixelFormat(DXGI_FORMAT_UNKNOWN, D2D1_ALPHA_MODE_PREMULTIPLIED),
        dpiX, dpiY);

    // Create a D2D render target which can draw into the surface in the swap
    // chain
    DXSafeRelease(&m_pBackBufferRT);
    hr = m_pD2DFactory->CreateDxgiSurfaceRenderTarget(pBackBuffer, &props,
                                                      &m_pBackBufferRT);
  }

  DXSafeRelease(&pBackBuffer);
  DXSafeRelease(&pBackBufferResource);
  DXSafeRelease(&deviceContext);

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::CreateD3DDeviceResources                        *
 *                                                                 *
 *  This method creates all the remaining D3D device resources     *
 *  required to render the scene. This method is called from       *
 *  CreateDeviceResources, and as such, it relies on the device    *
 *  and swap chain aleady being created.                           *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::CreateD3DDeviceResources() {
  HRESULT hr = S_OK;

  // Create rasterizer state object
  D3D11_RASTERIZER_DESC rsDesc;
  ID3D11DeviceContext *deviceContext = nullptr;

  rsDesc.AntialiasedLineEnable = FALSE;
  rsDesc.CullMode = D3D11_CULL_NONE;
  rsDesc.DepthBias = 0;
  rsDesc.DepthBiasClamp = 0;
  rsDesc.DepthClipEnable = TRUE;
  rsDesc.FillMode = D3D11_FILL_SOLID;
  rsDesc.FrontCounterClockwise = FALSE; // Must be FALSE for 10on9
  rsDesc.MultisampleEnable = FALSE;
  rsDesc.ScissorEnable = FALSE;
  rsDesc.SlopeScaledDepthBias = 0;

  hr = m_pDevice->CreateRasterizerState(&rsDesc, &m_pState);
  if (SUCCEEDED(hr)) {
    m_pDevice->GetImmediateContext(&deviceContext);
    deviceContext->RSSetState(m_pState);
    deviceContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);

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

    hr = m_pDevice->CreateTexture2D(&texDesc, nullptr, &m_pOffscreenTexture);
  }
  if (SUCCEEDED(hr)) {
    // Convert the Direct2D texture into a Shader Resource View
    DXSafeRelease(&m_pTextureRV);
    hr = m_pDevice->CreateShaderResourceView(m_pOffscreenTexture, nullptr,
                                             &m_pTextureRV);
  }
  if (SUCCEEDED(hr)) {
    D3D11_BUFFER_DESC bd;
    bd.Usage = D3D11_USAGE_DEFAULT;
    bd.ByteWidth = sizeof(s_VertexArray);
    bd.BindFlags = D3D11_BIND_VERTEX_BUFFER;
    bd.CPUAccessFlags = 0;
    bd.MiscFlags = 0;
    D3D11_SUBRESOURCE_DATA InitData;
    InitData.pSysMem = s_VertexArray;

    hr = m_pDevice->CreateBuffer(&bd, &InitData, &m_pVertexBuffer);
    if (SUCCEEDED(hr)) {
      // Set vertex buffer
      UINT stride = sizeof(SimpleVertex);
      UINT offset = 0;
      ID3D11Buffer *pVertexBuffer = m_pVertexBuffer;

      deviceContext->IASetVertexBuffers(0, // StartSlot
                                    1, // NumBuffers
                                    &pVertexBuffer, &stride, &offset);
    }
  }
  if (SUCCEEDED(hr)) {
    D3D11_BUFFER_DESC bd;
    bd.Usage = D3D11_USAGE_DEFAULT;
    bd.ByteWidth = sizeof(s_FacesIndexArray);
    bd.BindFlags = D3D11_BIND_INDEX_BUFFER;
    bd.CPUAccessFlags = 0;
    bd.MiscFlags = 0;
    D3D11_SUBRESOURCE_DATA InitData;
    InitData.pSysMem = s_FacesIndexArray;

    hr = m_pDevice->CreateBuffer(&bd, &InitData, &m_pFacesIndexBuffer);
  }

  if (SUCCEEDED(hr)) {
    // Load pixel shader
    hr = LoadResourceShader(m_pDevice, MAKEINTRESOURCE(IDR_PIXEL_SHADER),
                            &m_pShader);
  }
  if (SUCCEEDED(hr)) {
    // Obtain the technique
    m_pTechniqueNoRef = m_pShader->GetTechniqueByName("Render");
    hr = m_pTechniqueNoRef ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    // Obtain the variables
    m_pWorldVariableNoRef = m_pShader->GetVariableByName("World")->AsMatrix();
    hr = m_pWorldVariableNoRef ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    m_pViewVariableNoRef = m_pShader->GetVariableByName("View")->AsMatrix();
    hr = m_pViewVariableNoRef ? S_OK : E_FAIL;

    if (SUCCEEDED(hr)) {
      // Initialize the view matrix.
      D3DXVECTOR3 Eye(0.0f, 2.0f, -6.0f);
      D3DXVECTOR3 At(0.0f, 0.0f, 0.0f);
      D3DXVECTOR3 Up(0.0f, 1.0f, 0.0f);
      D3DMatrixLookAtLH(&m_ViewMatrix, &Eye, &At, &Up);
      m_pViewVariableNoRef->SetMatrix((float *)&m_ViewMatrix);
    }
  }
  if (SUCCEEDED(hr)) {
    m_pDiffuseVariableNoRef =
        m_pShader->GetVariableByName("txDiffuse")->AsShaderResource();
    hr = m_pDiffuseVariableNoRef ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    m_pProjectionVariableNoRef =
        m_pShader->GetVariableByName("Projection")->AsMatrix();
    hr = m_pProjectionVariableNoRef ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    // Define the input layout
    UINT numElements = ARRAYSIZE(s_InputLayout);

    // Create the input layout
    D3DX11_PASS_DESC PassDesc;
    m_pTechniqueNoRef->GetPassByIndex(0)->GetDesc(&PassDesc);

    hr = m_pDevice->CreateInputLayout(
        s_InputLayout, numElements, PassDesc.pIAInputSignature,
        PassDesc.IAInputSignatureSize, &m_pVertexLayout);
    if (SUCCEEDED(hr)) {
      // Set the input layout
      deviceContext->IASetInputLayout(m_pVertexLayout);
    }
  }
  DXSafeRelease(&deviceContext);
  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::CreateD2DDeviceResources                        *
 *                                                                 *
 *  This method creates all window-size-independent D2D resources. *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::CreateD2DDeviceResources() {
  HRESULT hr = S_OK;

  IDXGISurface *pDxgiSurface = nullptr;
  ID2D1GradientStopCollection *pGradientStops = nullptr;

  hr = m_pOffscreenTexture->QueryInterface(&pDxgiSurface);
  if (SUCCEEDED(hr)) {
    // Create a D2D render target which can draw into our offscreen D3D
    // surface. Given that we use a constant size for the texture, we
    // fix the DPI at 96.
    D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT,
        D2D1::PixelFormat(DXGI_FORMAT_UNKNOWN, D2D1_ALPHA_MODE_PREMULTIPLIED),
        96, 96);
    DXSafeRelease(&m_pRenderTarget);
    hr = m_pD2DFactory->CreateDxgiSurfaceRenderTarget(pDxgiSurface, &props,
                                                      &m_pRenderTarget);
  }
  if (SUCCEEDED(hr)) {
    // Create a linear gradient brush for the window background
    static const D2D1_GRADIENT_STOP stopsBackground[] = {
        {0.f, {0.f, 0.f, 0.2f, 1.f}}, // Starting with blue
        {1.f, {0.f, 0.f, 0.5f, 1.f}}  // Toward black
    };

    hr = m_pRenderTarget->CreateGradientStopCollection(
        stopsBackground, ARRAYSIZE(stopsBackground), &pGradientStops);
  }
  if (SUCCEEDED(hr)) {
    hr = m_pBackBufferRT->CreateLinearGradientBrush(
        D2D1::LinearGradientBrushProperties(D2D1::Point2F(0.0f, 0.0f),
                                            D2D1::Point2F(0.0f, 1.0f)),
        pGradientStops, &m_pBackBufferGradientBrush);
  }
  if (SUCCEEDED(hr)) {
    // Create a red brush for text drawn into the back buffer
    hr = m_pRenderTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Red),
                                                &m_pBackBufferTextBrush);
  }
  if (SUCCEEDED(hr)) {
    // Create a linear gradient brush for the 2D geometry
    static const D2D1_GRADIENT_STOP stopsGeometry[] = {
        {0.f, {0.f, 1.f, 1.f, 0.25f}}, // Starting with lt.blue
        {1.f, {0.f, 0.f, 1.f, 1.f}},   // Toward blue
    };

    DXSafeRelease(&pGradientStops);
    hr = m_pRenderTarget->CreateGradientStopCollection(
        stopsGeometry, ARRAYSIZE(stopsGeometry), &pGradientStops);
    if (SUCCEEDED(hr)) {
      hr = m_pRenderTarget->CreateLinearGradientBrush(
          D2D1::LinearGradientBrushProperties(D2D1::Point2F(100, 0),
                                              D2D1::Point2F(100, 200)),
          D2D1::BrushProperties(), pGradientStops, &m_pLGBrush);
    }
  }
  if (SUCCEEDED(hr)) {
    // create a black brush
    hr = m_pRenderTarget->CreateSolidColorBrush(
        D2D1::ColorF(D2D1::ColorF::Black), &m_pBlackBrush);
  }
  if (SUCCEEDED(hr)) {
    hr = LoadResourceBitmap(m_pRenderTarget, m_pWICFactory, L"SampleImage",
                            L"Image", 100, 0, &m_pBitmap);
  }
  if (SUCCEEDED(hr)) {
    hr = CreateGridPatternBrush(m_pRenderTarget, &m_pGridPatternBitmapBrush);
    if (SUCCEEDED(hr)) {
      m_pGridPatternBitmapBrush->SetOpacity(0.5f);
    }
  }

  DXSafeRelease(&pDxgiSurface);
  DXSafeRelease(&pGradientStops);

  return hr;
}

//
// Creates a pattern brush.
//
HRESULT
OverlayApp::CreateGridPatternBrush(ID2D1RenderTarget *pRenderTarget,
                                      ID2D1BitmapBrush **ppBitmapBrush) {
  HRESULT hr = S_OK;

  // Create a compatible render target.
  ID2D1BitmapRenderTarget *pCompatibleRenderTarget = nullptr;
  hr = pRenderTarget->CreateCompatibleRenderTarget(D2D1::SizeF(10.0f, 10.0f),
                                                   &pCompatibleRenderTarget);
  if (SUCCEEDED(hr)) {
    // Draw a pattern.
    ID2D1SolidColorBrush *pGridBrush = nullptr;
    hr = pCompatibleRenderTarget->CreateSolidColorBrush(
        D2D1::ColorF(D2D1::ColorF(0.93f, 0.94f, 0.96f, 1.0f)), &pGridBrush);
    if (SUCCEEDED(hr)) {
      pCompatibleRenderTarget->BeginDraw();
      pCompatibleRenderTarget->FillRectangle(
          D2D1::RectF(0.0f, 0.0f, 10.0f, 1.0f), pGridBrush);
      pCompatibleRenderTarget->FillRectangle(
          D2D1::RectF(0.0f, 0.1f, 1.0f, 10.0f), pGridBrush);
      pCompatibleRenderTarget->EndDraw();

      // Retrieve the bitmap from the render target.
      ID2D1Bitmap *pGridBitmap = nullptr;
      hr = pCompatibleRenderTarget->GetBitmap(&pGridBitmap);
      if (SUCCEEDED(hr)) {
        // Choose the tiling mode for the bitmap brush.
        D2D1_BITMAP_BRUSH_PROPERTIES brushProperties =
            D2D1::BitmapBrushProperties(D2D1_EXTEND_MODE_WRAP,
                                        D2D1_EXTEND_MODE_WRAP);

        // Create the bitmap brush.
        hr = m_pRenderTarget->CreateBitmapBrush(pGridBitmap, brushProperties,
                                                ppBitmapBrush);

        pGridBitmap->Release();
      }
      pGridBrush->Release();
    }
    pCompatibleRenderTarget->Release();
  }

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::DiscardDeviceResources                          *
 *                                                                 *
 *  Certain resources (eg. device, swap chain, RT) are bound to a  *
 *  particular D3D device. Under certain conditions (eg. change    *
 *  display mode, remoting, removing a video adapter), it is       *
 *  necessary to discard device-specific resources. This method    *
 *  just releases all of the device-bound resources that we're     *
 *  holding onto.                                                  *
 *                                                                 *
 ******************************************************************/

void OverlayApp::DiscardDeviceResources() {

  DXSafeRelease(&m_pDevice);
  DXSafeRelease(&m_pSwapChain);
  DXSafeRelease(&m_pRenderTargetView);
  DXSafeRelease(&m_pState);

  DXSafeRelease(&m_pDepthStencil);
  DXSafeRelease(&m_pDepthStencilView);
  DXSafeRelease(&m_pOffscreenTexture);
  DXSafeRelease(&m_pShader);
  DXSafeRelease(&m_pVertexBuffer);
  DXSafeRelease(&m_pVertexLayout);
  DXSafeRelease(&m_pFacesIndexBuffer);
  DXSafeRelease(&m_pTextureRV);

  DXSafeRelease(&m_pBackBufferRT);
  DXSafeRelease(&m_pBackBufferTextBrush);
  DXSafeRelease(&m_pBackBufferGradientBrush);
  DXSafeRelease(&m_pGridPatternBitmapBrush);

  DXSafeRelease(&m_pRenderTarget);
  DXSafeRelease(&m_pLGBrush);
  DXSafeRelease(&m_pBlackBrush);
  DXSafeRelease(&m_pBitmap);
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::RunMessageLoop                                  *
 *                                                                 *
 *  This is the main message pump for the application              *
 *                                                                 *
 ******************************************************************/

void OverlayApp::RunMessageLoop() {
  MSG msg;

  while (GetMessage(&msg, nullptr, 0, 0)) {
    TranslateMessage(&msg);
    DispatchMessage(&msg);
  }
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::OnRender                                        *
 *                                                                 *
 *  This method is called when the app needs to paint the window.  *
 *  It uses a D2D RT to draw a gradient background into the swap   *
 *  chain buffer. Then, it uses a separate D2D RT to draw a        *
 *  2D scene into a D3D texture. This texture is mapped onto a     *
 *  simple planar 3D model and displayed using D3D.                *
 *                                                                 *
 ******************************************************************/

HRESULT OverlayApp::OnRender() {
  HRESULT hr;

  static float t = 0.0f;
  static DWORD dwTimeStart = 0;

  hr = CreateDeviceResources();

  ID3D11DeviceContext *deviceContext = nullptr;
  m_pDevice->GetImmediateContext(&deviceContext);

  if (SUCCEEDED(hr) && m_pRenderTarget) {
    DWORD dwTimeCur = GetTickCount();
    if (dwTimeStart == 0) {
      dwTimeStart = dwTimeCur;
    }
    t = (dwTimeCur - dwTimeStart) / 3000.0f;

    float a = (t * 360.0f) * ((float)D3DX_PI / 180.0f);
    D3DMatrixRotationY(&m_WorldMatrix, a);

    // Swap chain will tell us how big the back buffer is
    DXGI_SWAP_CHAIN_DESC swapDesc;
    hr = m_pSwapChain->GetDesc(&swapDesc);

    if (SUCCEEDED(hr)) {
      deviceContext->ClearDepthStencilView(m_pDepthStencilView, D3D11_CLEAR_DEPTH,
                                       1, 0);

      // Draw a gradient background before we draw the cube
      if (m_pBackBufferRT) {
        m_pBackBufferRT->BeginDraw();

        m_pBackBufferGradientBrush->SetTransform(
            D2D1::Matrix3x2F::Scale(m_pBackBufferRT->GetSize()));

        D2D1_RECT_F rect =
            D2D1::RectF(0.0f, 0.0f, (float)swapDesc.BufferDesc.Width,
                        (float)swapDesc.BufferDesc.Height);

        m_pBackBufferRT->FillRectangle(&rect, m_pBackBufferGradientBrush);

        hr = m_pBackBufferRT->EndDraw();
      }
      if (SUCCEEDED(hr)) {
        m_pDiffuseVariableNoRef->SetResource(nullptr);
        m_pTechniqueNoRef->GetPassByIndex(0)->Apply(0,deviceContext);

        // Draw the D2D content into a D3D surface.
        hr = RenderD2DContentIntoSurface();
      }
      if (SUCCEEDED(hr)) {
        m_pDiffuseVariableNoRef->SetResource(m_pTextureRV);

        // Update variables that change once per frame.
        m_pWorldVariableNoRef->SetMatrix((float *)&m_WorldMatrix);

        // Set the index buffer.
        deviceContext->IASetIndexBuffer(m_pFacesIndexBuffer, DXGI_FORMAT_R16_UINT,
                                    0);

        // Render the scene
        m_pTechniqueNoRef->GetPassByIndex(0)->Apply(0,deviceContext);

        deviceContext->DrawIndexed(ARRAYSIZE(s_FacesIndexArray), 0, 0);

        // Draw some text using a red brush on top of everything
        if (m_pBackBufferRT) {
          m_pBackBufferRT->BeginDraw();

          m_pBackBufferRT->SetTransform(D2D1::Matrix3x2F::Identity());

          // Text format object will center the text in layout
          D2D1_SIZE_F rtSize = m_pBackBufferRT->GetSize();
          m_pBackBufferRT->DrawText(
              sc_helloWorld, ARRAYSIZE(sc_helloWorld) - 1, m_pTextFormat,
              D2D1::RectF(0.0f, 0.0f, rtSize.width, rtSize.height),
              m_pBackBufferTextBrush);

          hr = m_pBackBufferRT->EndDraw();
        }
        if (SUCCEEDED(hr)) {
          hr = m_pSwapChain->Present(1, 0);
        }
      }
    }
  }

  // DXSafeRelease(&deviceContext);
  // If the device is lost for any reason, we need to recreate it
  if (hr == DXGI_ERROR_DEVICE_RESET || hr == DXGI_ERROR_DEVICE_REMOVED ||
      hr == D2DERR_RECREATE_TARGET) {
    hr = S_OK;

    DiscardDeviceResources();
  }
  DXSafeRelease(&deviceContext);
  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::RenderD2DContentIntoSurface                     *
 *                                                                 *
 *  This method renders a simple 2D scene into a D2D render target *
 *  that maps to a D3D texture. It's important that the return     *
 *  code from RT->EndDraw() is handed back to the caller, since    *
 *  it's possible for the render target device to be lost while    *
 *  the application is running, and the caller needs to handle     *
 *  that error condition.                                          *
 *                                                                 *
 ******************************************************************/

HRESULT OverlayApp::RenderD2DContentIntoSurface() {
  HRESULT hr;
  D2D1_SIZE_F renderTargetSize = m_pRenderTarget->GetSize();

  m_pRenderTarget->BeginDraw();

  m_pRenderTarget->SetTransform(D2D1::Matrix3x2F::Identity());

  m_pRenderTarget->Clear(D2D1::ColorF(D2D1::ColorF::White));

  m_pRenderTarget->FillRectangle(
      D2D1::RectF(0.0f, 0.0f, renderTargetSize.width, renderTargetSize.height),
      m_pGridPatternBitmapBrush);

  D2D1_SIZE_F size = m_pBitmap->GetSize();

  m_pRenderTarget->DrawBitmap(m_pBitmap,
                              D2D1::RectF(0.0f, 0.0f, size.width, size.height));

  // Draw the bitmap at the bottom corner of the window
  m_pRenderTarget->DrawBitmap(
      m_pBitmap, D2D1::RectF(renderTargetSize.width - size.width,
                             renderTargetSize.height - size.height,
                             renderTargetSize.width, renderTargetSize.height));

  // Set the world transform to a 45 degree rotation at the center of the render
  // target and write "Hello, World"
  m_pRenderTarget->SetTransform(D2D1::Matrix3x2F::Rotation(
      45,
      D2D1::Point2F(renderTargetSize.width / 2, renderTargetSize.height / 2)));

  m_pRenderTarget->DrawText(
      sc_helloWorld, ARRAYSIZE(sc_helloWorld) - 1, m_pTextFormat,
      D2D1::RectF(0, 0, renderTargetSize.width, renderTargetSize.height),
      m_pBlackBrush);

  // Reset back to the identity transform
  m_pRenderTarget->SetTransform(
      D2D1::Matrix3x2F::Translation(0, renderTargetSize.height - 200));

  m_pRenderTarget->FillGeometry(m_pPathGeometry, m_pLGBrush);

  m_pRenderTarget->SetTransform(
      D2D1::Matrix3x2F::Translation(renderTargetSize.width - 200, 0));

  m_pRenderTarget->FillGeometry(m_pPathGeometry, m_pLGBrush);

  hr = m_pRenderTarget->EndDraw();

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::OnResize                                        *
 *                                                                 *
 *  This method is called in response to a WM_SIZE window message  *
 *                                                                 *
 *  When the window resizes, we need to resize the D3D swap chain  *
 *  and remap the corresponding D2D render target                  *
 *                                                                 *
 ******************************************************************/

void OverlayApp::OnResize(UINT width, UINT height) {
  if (!m_pDevice) {
    CreateDeviceResources();
  } else {
    RecreateSizedResources(width, height);
  }
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::OnGetMinMaxInfo                                 *
 *                                                                 *
 *  This method is called in response to a WM_GETMINMAXINFO window *
 *  message. We use it to set the minimum size of the window.      *
 *                                                                 *
 ******************************************************************/

void OverlayApp::OnGetMinMaxInfo(MINMAXINFO *pMinMaxInfo) {
  FLOAT dpiX, dpiY;
  m_pD2DFactory->GetDesktopDpi(&dpiX, &dpiY);

  pMinMaxInfo->ptMinTrackSize.x = static_cast<UINT>(ceil(200.f * dpiX / 96.f));
  pMinMaxInfo->ptMinTrackSize.y = static_cast<UINT>(ceil(200.f * dpiY / 96.f));
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::OnTimer                                         *
 *                                                                 *
 *                                                                 *
 ******************************************************************/

void OverlayApp::OnTimer() { InvalidateRect(m_hwnd, nullptr, FALSE); }

/******************************************************************
 *                                                                 *
 *  OverlayApp::WndProc                                         *
 *                                                                 *
 *  This static method handles our app's window messages           *
 *                                                                 *
 ******************************************************************/

LRESULT CALLBACK OverlayApp::WndProc(HWND hwnd, UINT message, WPARAM wParam,
                                        LPARAM lParam) {
  LRESULT result = 0;

  if (message == WM_CREATE) {
    LPCREATESTRUCT pcs = (LPCREATESTRUCT)lParam;
    OverlayApp *pDXGISampleApp = (OverlayApp *)pcs->lpCreateParams;

    ::SetWindowLongPtrW(hwnd, GWLP_USERDATA,
                        reinterpret_cast<LONG_PTR>(pDXGISampleApp));

    result = 1;
  } else {
    OverlayApp *pDXGISampleApp = reinterpret_cast<OverlayApp *>(
        ::GetWindowLongPtrW(hwnd, GWLP_USERDATA));

    bool wasHandled = false;

    if (pDXGISampleApp) {
      switch (message) {
      case WM_SIZE: {
        UINT width = LOWORD(lParam);
        UINT height = HIWORD(lParam);
        pDXGISampleApp->OnResize(width, height);
      }
        result = 0;
        wasHandled = true;
        break;

      case WM_GETMINMAXINFO: {
        MINMAXINFO *pMinMaxInfo = reinterpret_cast<MINMAXINFO *>(lParam);
        pDXGISampleApp->OnGetMinMaxInfo(pMinMaxInfo);
      }
        result = 0;
        wasHandled = true;
        break;

      case WM_PAINT:
      case WM_DISPLAYCHANGE: {
        PAINTSTRUCT ps;
        BeginPaint(hwnd, &ps);
        pDXGISampleApp->OnRender();
        EndPaint(hwnd, &ps);
      }
        result = 0;
        wasHandled = true;
        break;

      case WM_TIMER: {
        pDXGISampleApp->OnTimer();
      }
        result = 0;
        wasHandled = true;
        break;

      case WM_DESTROY: {
        PostQuitMessage(0);
      }
        result = 1;
        wasHandled = true;
        break;
      }
    }

    if (!wasHandled) {
      result = DefWindowProc(hwnd, message, wParam, lParam);
    }
  }

  return result;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::CreateD3DDevice                                 *
 *                                                                 *
 ******************************************************************/
HRESULT OverlayApp::CreateD3DDevice(IDXGIAdapter *pAdapter,
                                       D3D_DRIVER_TYPE driverType, UINT flags,
                                       ID3D11Device **ppDevice) {
  HRESULT hr = S_OK;


  static const D3D_FEATURE_LEVEL levelAttempts[] = {
      D3D_FEATURE_LEVEL_11_0,
      D3D_FEATURE_LEVEL_10_1,
  };

  D3D_FEATURE_LEVEL level;
  ID3D11Device *pDevice = nullptr;

  hr =
      D3D11CreateDevice(
        pAdapter, driverType, nullptr, flags,
                         levelAttempts, 2, D3D11_SDK_VERSION, &pDevice, &level, nullptr);

  if (SUCCEEDED(hr)) {
    // transfer reference
    *ppDevice = pDevice;
    pDevice = nullptr;
  }

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::LoadResourceBitmap                              *
 *                                                                 *
 *  This method loads and creates a D2D bitmap from a DLL resource.*
 *  The resultinig bitmap is bound to the supplied D2D render      *
 *  target device (pRT) and must be cleaned up when the RT is      *
 *  lost or released.                                              *
 *                                                                 *
 ******************************************************************/

HRESULT OverlayApp::LoadResourceBitmap(
    ID2D1RenderTarget *pRenderTarget, IWICImagingFactory *pIWICFactory,
    PCWSTR resourceName, PCWSTR resourceType, UINT destinationWidth,
    UINT destinationHeight, ID2D1Bitmap **ppBitmap) {
  HRESULT hr = S_OK;
  IWICBitmapDecoder *pDecoder = nullptr;
  IWICBitmapFrameDecode *pSource = nullptr;
  IWICStream *pStream = nullptr;
  IWICFormatConverter *pConverter = nullptr;
  IWICBitmapScaler *pScaler = nullptr;

  HRSRC imageResHandle = nullptr;
  HGLOBAL imageResDataHandle = nullptr;
  void *pImageFile = nullptr;
  DWORD imageFileSize = 0;

  // Locate the resource.
  imageResHandle =
      FindResourceW(HINST_THISCOMPONENT, resourceName, resourceType);
  hr = imageResHandle ? S_OK : E_FAIL;
  if (SUCCEEDED(hr)) {
    // Load the resource.
    imageResDataHandle = LoadResource(HINST_THISCOMPONENT, imageResHandle);

    hr = imageResDataHandle ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    // Lock it to get a system memory pointer.
    pImageFile = LockResource(imageResDataHandle);

    hr = pImageFile ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    // Calculate the size.
    imageFileSize = SizeofResource(HINST_THISCOMPONENT, imageResHandle);

    hr = imageFileSize ? S_OK : E_FAIL;
  }
  if (SUCCEEDED(hr)) {
    // Create a WIC stream to map onto the memory.
    hr = pIWICFactory->CreateStream(&pStream);
  }
  if (SUCCEEDED(hr)) {
    // Initialize the stream with the memory pointer and size.
    hr = pStream->InitializeFromMemory(reinterpret_cast<BYTE *>(pImageFile),
                                       imageFileSize);
  }
  if (SUCCEEDED(hr)) {
    // Create a decoder for the stream.
    hr = pIWICFactory->CreateDecoderFromStream(
        pStream, nullptr, WICDecodeMetadataCacheOnLoad, &pDecoder);
  }
  if (SUCCEEDED(hr)) {
    // Create the initial frame.
    hr = pDecoder->GetFrame(0, &pSource);
  }
  if (SUCCEEDED(hr)) {
    // Convert the image format to 32bppPBGRA
    // (DXGI_FORMAT_B8G8R8A8_UNORM + D2D1_ALPHA_MODE_PREMULTIPLIED).
    hr = pIWICFactory->CreateFormatConverter(&pConverter);
  }
  if (SUCCEEDED(hr)) {
    // If a new width or height was specified, create an
    // IWICBitmapScaler and use it to resize the image.
    if (destinationWidth != 0 || destinationHeight != 0) {
      UINT originalWidth, originalHeight;
      hr = pSource->GetSize(&originalWidth, &originalHeight);
      if (SUCCEEDED(hr)) {
        if (destinationWidth == 0) {
          FLOAT scalar = static_cast<FLOAT>(destinationHeight) /
                         static_cast<FLOAT>(originalHeight);
          destinationWidth =
              static_cast<UINT>(scalar * static_cast<FLOAT>(originalWidth));
        } else if (destinationHeight == 0) {
          FLOAT scalar = static_cast<FLOAT>(destinationWidth) /
                         static_cast<FLOAT>(originalWidth);
          destinationHeight =
              static_cast<UINT>(scalar * static_cast<FLOAT>(originalHeight));
        }

        hr = pIWICFactory->CreateBitmapScaler(&pScaler);
        if (SUCCEEDED(hr)) {
          hr = pScaler->Initialize(pSource, destinationWidth, destinationHeight,
                                   WICBitmapInterpolationModeCubic);
          if (SUCCEEDED(hr)) {
            hr = pConverter->Initialize(pScaler, GUID_WICPixelFormat32bppPBGRA,
                                        WICBitmapDitherTypeNone, nullptr, 0.f,
                                        WICBitmapPaletteTypeMedianCut);
          }
        }
      }
    } else {
      hr = pConverter->Initialize(pSource, GUID_WICPixelFormat32bppPBGRA,
                                  WICBitmapDitherTypeNone, nullptr, 0.f,
                                  WICBitmapPaletteTypeMedianCut);
    }
  }
  if (SUCCEEDED(hr)) {
    // create a Direct2D bitmap from the WIC bitmap.
    hr = pRenderTarget->CreateBitmapFromWicBitmap(pConverter, nullptr, ppBitmap);
  }

  DXSafeRelease(&pDecoder);
  DXSafeRelease(&pSource);
  DXSafeRelease(&pStream);
  DXSafeRelease(&pConverter);
  DXSafeRelease(&pScaler);

  return hr;
}

/******************************************************************
 *                                                                 *
 *  OverlayApp::LoadResourceShader                              *
 *                                                                 *
 *  This method loads and creates a pixel shader from a DLL        *
 *  resource                                                       *
 *                                                                 *
 ******************************************************************/

HRESULT OverlayApp::LoadResourceShader(ID3D11Device *pDevice,
                                          PCWSTR pszResource,
                                          ID3DX11Effect **ppShader) {
  auto hResource = ::FindResource(HINST_THISCOMPONENT, pszResource, RT_RCDATA);
  auto hr = hResource ? S_OK : E_FAIL;

  if (SUCCEEDED(hr)) {
    auto hResourceData = ::LoadResource(HINST_THISCOMPONENT, hResource);
    hr = hResourceData ? S_OK : E_FAIL;

    if (SUCCEEDED(hr)) {
      auto pData = ::LockResource(hResourceData);
      hr = pData ? S_OK : E_FAIL;

      if (SUCCEEDED(hr)) {
        SIZE_T dataSize = ::SizeofResource(HINST_THISCOMPONENT, hResource);
        hr = //::D3D11CreateEffectFromMemory(
          ::D3DX11CreateEffectFromMemory(
            pData,
            dataSize,
            0,
            pDevice,
            ppShader,
            "IDR_PIXEL_SHADER");

      }
    }
  }

  return hr;
}

