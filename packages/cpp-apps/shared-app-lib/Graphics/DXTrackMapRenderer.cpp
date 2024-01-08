//
// Created by jglanz on 1/7/2024.
//

#include "IRacingTools/Shared/Macros.h"

#include "../resource.h"
#include <IRacingTools/Shared/Graphics/DXTrackMapRenderer.h>

namespace IRacingTools {
namespace Shared {
namespace Graphics {

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

/*static*/
[[maybe_unused]] constexpr D3D11_INPUT_ELEMENT_DESC gInputLayout[] = {
    {"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0,
     D3D11_INPUT_PER_VERTEX_DATA, 0},
    {"TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT, 0, 12,
     D3D11_INPUT_PER_VERTEX_DATA, 0},
};

/*static*/ const SimpleVertex gVertexArray[] = {
    {D3DXVECTOR3(-1.0f, -1.0f, 1.0f), D3DXVECTOR2(1.0f, 1.0f)},
    {D3DXVECTOR3(1.0f, -1.0f, 1.0f), D3DXVECTOR2(0.0f, 1.0f)},
    {D3DXVECTOR3(1.0f, 1.0f, 1.0f), D3DXVECTOR2(0.0f, 0.0f)},
    {D3DXVECTOR3(-1.0f, 1.0f, 1.0f), D3DXVECTOR2(1.0f, 0.0f)}};

/*static*/ const SHORT gFacesIndexArray[] = {3, 1, 0, 2, 1, 3};

} // namespace

HRESULT DX11TrackMapRenderer::LoadResourceShader(ID3D11Device *pDevice,
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
            ::D3DX11CreateEffectFromMemory(pData, dataSize, 0, pDevice,
                                           ppShader, "IDR_PIXEL_TRACK_MAP_SHADER");
      }
    }
  }

  return hr;
}

DX11TrackMapRenderer::DX11TrackMapRenderer(
    DX11ResourceProvider *resourceProvider)
    : resourceProvider_(resourceProvider) {
  AssertMsg(SUCCEEDED(createD3DResources()), "Failed to create resources");
}

bool DX11TrackMapRenderer::isReady() const { return ready_; }

HRESULT DX11TrackMapRenderer::createD3DResources() {
  HRESULT hr = S_OK;

  D3D11_SUBRESOURCE_DATA InitData;
  auto device = resourceProvider_->getDevice();
  auto deviceContext = resourceProvider_->getDeviceContext();
  auto rasterizerState = resourceProvider_->getRasterizerState();

  device->GetImmediateContext(&deviceContext);
  deviceContext->RSSetState(rasterizerState.Get());
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

  hr = device->CreateTexture2D(&texDesc, nullptr, &offscreenTexture_);

  AssertMsg(SUCCEEDED(hr), "");
  // Convert the Direct2D texture into a Shader Resource View
  if (textureRV_)
    textureRV_->Release();
  hr = device->CreateShaderResourceView(offscreenTexture_.Get(), nullptr,
                                        &textureRV_);

  AssertMsg(SUCCEEDED(hr), "");
  D3D11_BUFFER_DESC bd;
  bd.Usage = D3D11_USAGE_DEFAULT;
  bd.ByteWidth = sizeof(gVertexArray);
  bd.BindFlags = D3D11_BIND_VERTEX_BUFFER;
  bd.CPUAccessFlags = 0;
  bd.MiscFlags = 0;

  InitData.pSysMem = gVertexArray;

  hr = device->CreateBuffer(&bd, &InitData, &vertexBuffer_);
  AssertMsg(SUCCEEDED(hr), "")
      // Set vertex buffer
      UINT stride = sizeof(SimpleVertex);
  UINT offset = 0;
  ID3D11Buffer *pVertexBuffer = vertexBuffer_.Get();

  deviceContext->IASetVertexBuffers(0, // StartSlot
                                    1, // NumBuffers
                                    &pVertexBuffer, &stride, &offset);

  AssertMsg(SUCCEEDED(hr), "");

  bd.Usage = D3D11_USAGE_DEFAULT;
  bd.ByteWidth = sizeof(gFacesIndexArray);
  bd.BindFlags = D3D11_BIND_INDEX_BUFFER;
  bd.CPUAccessFlags = 0;
  bd.MiscFlags = 0;

  InitData.pSysMem = gFacesIndexArray;

  hr = device->CreateBuffer(&bd, &InitData, &facesIndexBuffer_);

  // Load pixel shader
  hr = LoadResourceShader(
      device.Get(), MAKEINTRESOURCE(IDR_PIXEL_TRACK_MAP_SHADER), &shader_);
  AssertMsg(SUCCEEDED(hr), "Failed to load shader");

  // Obtain the technique
  techniqueNoRef_ = shader_->GetTechniqueByName("Render");
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
  diffuseVariableNoRef_ =
      shader_->GetVariableByName("txDiffuse")->AsShaderResource();
  hr = diffuseVariableNoRef_ ? S_OK : E_FAIL;
  AssertMsg(SUCCEEDED(hr), "failed to get txDiffuse");
  projectionVariableNoRef_ =
      shader_->GetVariableByName("Projection")->AsMatrix();
  hr = projectionVariableNoRef_ ? S_OK : E_FAIL;

  AssertMsg(SUCCEEDED(hr), "failed to get projection");
  ready_ = true;
  return hr;
}

} // namespace Graphics
} // namespace Shared
} // namespace IRacingTools