//
// Created by jglanz on 1/5/2024.
//

#pragma once

#include <IRacingTools/Shared/SHM/SHM.h>

namespace IRacingTools::Shared::SHM::DX11 {
    using namespace IRacingTools::Shared::SHM;
    class Texture final : public IPCClientTexture {
    public:
        Texture() = delete;
        Texture(
            const PixelSize&,
            uint8_t swapchainIndex,
            const winrt::com_ptr<ID3D11Device5>&,
            const winrt::com_ptr<ID3D11DeviceContext4>&
        );
        virtual ~Texture();

        ID3D11Texture2D* getD3D11Texture() const noexcept;
        ID3D11ShaderResourceView* getD3D11ShaderResourceView() noexcept;

        void copyFrom(
            ID3D11Texture2D* texture,
            ID3D11Fence* fenceIn,
            uint64_t fenceInValue,
            ID3D11Fence* fenceOut,
            uint64_t fenceOutValue
        ) noexcept;

    private:
        winrt::com_ptr<ID3D11Device5> device_;
        winrt::com_ptr<ID3D11DeviceContext4> context_;

        winrt::com_ptr<ID3D11Texture2D> cacheTexture_;
        winrt::com_ptr<ID3D11ShaderResourceView> cacheShaderResourceView_;
    };

    class SHMDX11CachedReader : public SHM::SHMCachedReader, protected SHM::IPCTextureCopier {
    public:
        SHMDX11CachedReader() = delete;
        explicit SHMDX11CachedReader(ConsumerKind);
        virtual ~SHMDX11CachedReader();

        void initializeCache(ID3D11Device*, uint8_t swapchainLength);

    protected:
        virtual void copy(
            HANDLE sourceTexture,
            IPCClientTexture* destinationTexture,
            HANDLE fence,
            uint64_t fenceValueIn
        ) noexcept override;

        virtual std::shared_ptr<SHM::IPCClientTexture> createIPCClientTexture(
            const PixelSize&,
            uint8_t swapchainIndex
        ) noexcept override;

        virtual void releaseIPCHandles() override;
        void waitForPendingCopies();

        winrt::com_ptr<ID3D11Device5> device_;
        winrt::com_ptr<ID3D11DeviceContext4> deviceContext_;
        uint64_t deviceLUID_;

        struct FenceAndValue {
            winrt::com_ptr<ID3D11Fence> fence_;
            uint64_t value_{};

            explicit operator bool() const noexcept {
                return fence_ && value_;
            }
        };

        std::unordered_map<HANDLE, FenceAndValue> ipcFences_;
        std::unordered_map<HANDLE, winrt::com_ptr<ID3D11Texture2D>> ipcTextures_;
        FenceAndValue copyFence_;

        FenceAndValue* getIPCFence(HANDLE) noexcept;
        ID3D11Texture2D* getIPCTexture(HANDLE) noexcept;
    };
} // namespace OpenKneeboard::SHM::D3D11
