
## Create DirectX 11 shared textures & handles

```c++
InterprocessRenderer::IPCTextureResources*
InterprocessRenderer::GetIPCTextureResources(
  uint8_t textureIndex,
  const PixelSize& size) {
  auto& ret = mIPCSwapchain.at(textureIndex);
  if (ret.mTextureSize == size) [[likely]] {
    return &ret;
  }

  OPENKNEEBOARD_TraceLoggingScopedActivity(
    activity,
    "InterprocessRenderer::GetIPCTextureResources:",
    TraceLoggingValue(textureIndex, "textureIndex"),
    TraceLoggingValue(size.mWidth, "width"),
    TraceLoggingValue(size.mHeight, "height"));

  ret = {};

  auto device = mDXR->mD3D11Device.get();

  D3D11_TEXTURE2D_DESC textureDesc {
    .Width = static_cast<UINT>(size.mWidth),
    .Height = static_cast<UINT>(size.mHeight),
    .MipLevels = 1,
    .ArraySize = 1,
    .Format = SHM::SHARED_TEXTURE_PIXEL_FORMAT,
    .SampleDesc = {1, 0},
    .BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE,
    .MiscFlags
    = D3D11_RESOURCE_MISC_SHARED_NTHANDLE | D3D11_RESOURCE_MISC_SHARED,
  };

  check_hresult(
    device->CreateTexture2D(&textureDesc, nullptr, ret.mTexture.put()));
  check_hresult(device->CreateRenderTargetView(
    ret.mTexture.get(), nullptr, ret.mRenderTargetView.put()));
  check_hresult(ret.mTexture.as<IDXGIResource1>()->CreateSharedHandle(
    nullptr, DXGI_SHARED_RESOURCE_READ, nullptr, ret.mTextureHandle.put()));

  TraceLoggingWriteTagged(activity, "Creating new fence");
  check_hresult(device->CreateFence(
    0, D3D11_FENCE_FLAG_SHARED, IID_PPV_ARGS(ret.mFence.put())));
  check_hresult(ret.mFence->CreateSharedHandle(
    nullptr, GENERIC_ALL, nullptr, ret.mFenceHandle.put()));

  ret.mViewport = {
    0,
    0,
    static_cast<FLOAT>(size.mWidth),
    static_cast<FLOAT>(size.mHeight),
    0.0f,
    1.0f,
  };
  ret.mTextureSize = size;

  return &ret;
}
```