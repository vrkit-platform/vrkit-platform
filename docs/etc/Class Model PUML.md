
```puml
@startuml

/' Objects '/

namespace IRacingTools {
	namespace Shared {
		class DiskSessionDataProvider {
			+DiskSessionDataProvider(const std::filesystem::path& file, SDK::ClientId clientId)
			+~DiskSessionDataProvider()
			-clientId_ : SDK::ClientId
			+timing() : Timing
			+isAvailable() : bool
			+isControllable() : bool {query}
			+isLive() : bool {query}
			+isPaused() : bool
			+isRunning() : bool
			+pause() : bool
			-processYAMLLiveString() : bool
			+resume() : bool
			+start() : bool
			-file_ : std::filesystem::path
			-diskClient_ : std::shared_ptr<SDK::DiskClient>
			-dataAccess_ : std::unique_ptr<SessionDataAccess>
			-checkConnection() : void
			-fireDataUpdatedEvent() : void
			-init() : void
			-process() : void
			#runnable() : void
			+stop() : void
			-updateSessionTiming() : void
		}

		class LiveSessionDataProvider {
			+LiveSessionDataProvider()
			+~LiveSessionDataProvider()
			-dataAccess_ : SessionDataAccess
			+timing() : Timing
			+isAvailable() : bool
			+isControllable() : bool {query}
			+isPaused() : bool
			+isRunning() : bool
			+pause() : bool
			-processYAMLLiveString() : bool
			+resume() : bool
			+start() : bool
			-checkConnection() : void
			-init() : void
			-process() : void
			-processData() : void
			-processDataUpdate() : void
			#runnable() : void
			+stop() : void
		}

		class SessionDataAccess {
			+DeclareVarHolder(PitsOpen)
			+DeclareVarHolder(RaceLaps)
			+DeclareVarHolder(SessionFlags)
			+DeclareVarHolder(SessionLapsRemain)
			+DeclareVarHolder(SessionLapsRemainEx)
			+DeclareVarHolder(SessionNum)
			+DeclareVarHolder(SessionState)
			+DeclareVarHolder(SessionTick)
			+DeclareVarHolder(SessionTime)
			+DeclareVarHolder(SessionTimeOfDay)
			+DeclareVarHolder(SessionTimeRemain)
			+DeclareVarHolder(SessionUniqueID)
			+DeclareVarHolder(CarIdxEstTime)
			+DeclareVarHolder(CarIdxClassPosition)
			+DeclareVarHolder(CarIdxF2Time)
			+DeclareVarHolder(CarIdxGear)
			+DeclareVarHolder(CarIdxLap)
			+DeclareVarHolder(CarIdxLapCompleted)
			+DeclareVarHolder(CarIdxLapDistPct)
			+DeclareVarHolder(CarIdxOnPitRoad)
			+DeclareVarHolder(CarIdxPosition)
			+DeclareVarHolder(CarIdxRPM)
			+DeclareVarHolder(CarIdxSteer)
			+DeclareVarHolder(CarIdxTrackSurface)
			+DeclareVarHolder(CarIdxTrackSurfaceMaterial)
			+DeclareVarHolder(CarIdxLastLapTime)
			+DeclareVarHolder(CarIdxBestLapTime)
			+DeclareVarHolder(CarIdxBestLapNum)
			+DeclareVarHolder(CarIdxP2P_Status)
			+DeclareVarHolder(CarIdxP2P_Count)
			+DeclareVarHolder(PaceMode)
			+DeclareVarHolder(CarIdxPaceLine)
			+DeclareVarHolder(CarIdxPaceRow)
			+DeclareVarHolder(CarIdxPaceFlags)
			+SessionDataAccess(std::weak_ptr<SDK::Client> client)
			+getClient() : std::shared_ptr<IRacingTools::SDK::Client>
			-client_ : std::weak_ptr<IRacingTools::SDK::Client>
		}

		class SessionDataEvent {
			+SessionDataEvent(SessionDataEventType type)
			+~SessionDataEvent()
			#type_ : SessionDataEventType
			+type() : int
		}

		abstract class SessionDataProvider {
			+~SessionDataProvider()
			+{static} GetCurrent() : SessionDataProviderPtr
			+{static} SetCurrent(shared_ptr<SessionDataProvider> next) : SessionDataProviderPtr
			+{abstract} timing() : Timing
			+{abstract} isAvailable() : bool
			+{abstract} isControllable() : bool {query}
			+{abstract} isLive() : bool {query}
			+{abstract} isPaused() : bool
			+{abstract} isRunning() : bool
			+{abstract} pause() : bool
			+{abstract} resume() : bool
			+{abstract} start() : bool
			+{abstract} stop() : void
		}

		class SessionDataUpdatedDataEvent {
			+SessionDataUpdatedDataEvent(SessionDataEventType type, SessionDataAccess* dataAccess)
			+~SessionDataUpdatedDataEvent()
			-dataAccess_ : SessionDataAccess*
			+sessionTimeMillis() : int
			+cars() : std::vector<SessionCarState>&
			+sessionInfo() : std::weak_ptr<SDK::SessionInfo::SessionInfoMessage>
			+refresh() : void
		}

		class Timer {
			+Timer()
			+~Timer()
			+add(time_point<Clock> when, function<void ( TimerId )> handler, microseconds period) : TimerId
			+add(const std::chrono::duration<Rep, Period>& when, function<void ( TimerId )> handler, microseconds period) : TimerId
			+add(const uint64_t when, function<void ( TimerId )> handler, const uint64_t period) : TimerId
			-done_ : bool
			+remove(size_t id) : bool
			-cond_ : std::condition_variable
			-timeEvents_ : std::multiset<detail::TimeEvent>
			-mutex_ : std::mutex
			-freeIds_ : std::stack<TimerId>
			-worker_ : std::thread
			-events_ : std::vector<detail::Event>
			-run() : void
		}

		enum Rect::Origin {
			BottomLeft
			TopLeft
		}

		enum ScaleToFitMode {
			GrowOnly
			ShrinkOnly
			ShrinkOrGrow
		}

		enum SessionDataEventType {
			Available
			Session
			Updated
		}

		class Point <template<class T>> {
			+operatorD2D1_POINT_2F() {query}
			+operatorD2D1_POINT_2U() {query}
			+operator*(const T operand) : Point<T> {query}
			+operator+(Point<T> lhs, const Point<T>& rhs) : Point<T>
			+operator/(const T divisor) : Point<T> {query}
			+operator+=(const Point<T>& operand) : Point<T>&
			+staticCast() : TPoint {query}
			+operator<=>(const Point<T> &) : auto {query}
			+x() : auto {query}
			+y() : auto {query}
			+rounded() : requires std::floating_point<T>TPoint {query}
		}

		class Rect <template<class T>> {
			+operatorD2D1_RECT_F() {query}
			+operatorD2D_RECT_U() {query}
			+operatorD3D11_RECT() {query}
			+operatorbool() {query}
			+bottomRight() : Point<T> {query}
			+offset() : Point<T> {query}
			+topLeft() : Point<T> {query}
			+operator*(const TValue operand) : Rect<T> {query}
			+operator/(const T divisor) : Rect<T> {query}
			+withOrigin(Origin otherOrigin, const Size<T>& container) : Rect<T> {query}
			+size() : Size<T> {query}
			+staticCast() : TRect {query}
			+staticCastWithBottomRight() : TRect {query}
			+bottom() : auto {query}
			+height() : auto {query}
			+left() : auto {query}
			+operator<=>(const Rect<T> &) : auto {query}
			+right() : auto {query}
			+top() : auto {query}
			+width() : auto {query}
			+origin() : int {query}
			+operator*(const TValue operand) : requires std :: floating_point<T>Rect<T> {query}
			+rounded() : requires std::floating_point<T>Rect<TValue> {query}
		}

		class SessionDataProvider::Timing {
		}

		class SessionDataUpdatedDataEvent::SessionCarState {
			+toTuple() : SessionCarStateRecord
			+driver : std::optional<SDK::SessionInfo::Driver>
		}

		class SessionDataUpdatedDataEvent::SessionCarState::anon_struct_1 {
		}

		class Size <template<class T>> {
			+Size(const T& width, const T& height)
			+operatorD2D1_SIZE_F() {query}
			+operatorD2D1_SIZE_U() {query}
			+operatorbool() {query}
			+requires(std::integral<T>| | std::floating_point<TValue>) constexpr TSize staticCast () {query}
			+integerScaledToFit(const Size<T>& container, ScaleToFitMode mode) : Size<T> {query}
			+operator*(const std::integral auto operand) : Size<T> {query}
			+operator*(const std::floating_point auto operand) : Size<T> {query}
			+operator/(const T divisor) : Size<T> {query}
			+scaledToFit(const Size<T>& container, ScaleToFitMode mode) : Size<T> {query}
			+height() : T {query}
			+width() : T {query}
			+floor() : TSize {query}
			+height() : auto {query}
			+operator<=>(const Size<T> &) : auto {query}
			+width() : auto {query}
			+rounded() : requires std::floating_point<T>TSize {query}
		}

		namespace detail {
			class Event {
				+Event()
				+Event(size_t id, time_point<Clock> start, microseconds period, Func&& handler)
				+Event(Event&& r)
				+operator=(Event&& ev) : Event&
				+valid : bool
				+handler : function<void ( TimerId )>
				+period : microseconds
				+id : size_t
				+start : time_point<Clock>
			}

			class TimeEvent {
				+ref : size_t
				+next : time_point<Clock>
			}
		}

		namespace VR {
			enum VRRenderConfig::Quirks::Upscaling {
				AlwaysOff
				AlwaysOn
				Automatic
			}

			class GazeTargetScale {
				+operator<=>(const GazeTargetScale &) : auto {query}
			}

			class VRLayer {
				+physicalSize : Size<float>
				+pose : VRPose
				+zoomScale : float
			}

			class VROpacityConfig {
				+operator<=>(const VROpacityConfig &) : auto {query}
			}

			class VRPose {
				+getHorizontalMirror() : VRPose {query}
				+operator<=>(const VRPose &) : auto {query}
				+rX : float
				+rX : float
				+rX : float
				+x : float
				+x : float
				+x : float
				+x : float
				+x : float
				+x : float
			}

			class VRRenderConfig {
				+operator<=>(const VRRenderConfig &) : auto {query}
				+recenterCount : uint64_t
			}

			class VRRenderConfig::Quirks {
				+operator<=>(Quirks &) : auto {query}
			}
		}

		namespace Utils {
			class COMException {
				+COMException(HRESULT hr)
				+getResult() : HRESULT {query}
				-result : HRESULT
				+what() : char* {query}
			}

			class HandleCloser {
				+operator()(HANDLE h) : void
			}

			class VirtualDeleter {
				+operator()(void* p) : void
			}
		}

		namespace UI {
			class BaseWindow <template<class WindowClazz>> {
				+BaseWindow()
				+~BaseWindow()
				+events : <anon-struct-1>
				+getCreateOptions() : CreateOptions
				+windowHandle() : HWND {query}
				#handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) : LRESULT
				+{static} WindowProc(HWND windowHandle, UINT messageType, WPARAM wParam, LPARAM lParam) : LRESULT CALLBACK
				+getSize() : Size<UINT>
				+getWindowClassOptions() : WNDCLASSEX
				+create(const CreateOptions& options) : bool
				+createResources() : bool
				+isCreated() : bool
				+isReady() : bool
				#defaultHandleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) : std::optional<LRESULT>
				+configureWindowClass(WNDCLASSEX& wc) : void
				+hide() : void
				+initialize() : void
				#onResize(const PixelSize& newSize, const PixelSize& oldSize) : void
				+show() : void
			}

			class D3D11Renderer {
				+D3D11Renderer(const winrt::com_ptr<ID3D11Device> &)
				+~D3D11Renderer()
				-destDimensions_ : PixelSize
				+getSHM() : SHM::SHMCachedReader*
				-spriteBatch_ : std::unique_ptr<Graphics::SpriteBatch>
				+getName() : std::wstring_view {query}
				+render(SHM::IPCClientTexture* sourceTexture, const PixelRect& sourceRect, HANDLE destTexture, const PixelSize& destTextureDimensions, const PixelRect& destRect, HANDLE fence, uint64_t fenceValueIn) : uint64_t
				+initialize(uint8_t swapchainLength) : void
				+saveTextureToFile(SHM::IPCClientTexture*, const std::filesystem::path &) : void
				-d3dDevice_ : winrt::com_ptr<ID3D11Device1>
				-d3dDeviceContext_ : winrt::com_ptr<ID3D11DeviceContext>
				-destRenderTargetView_ : winrt::com_ptr<ID3D11RenderTargetView>
				-destTexture_ : winrt::com_ptr<ID3D11Texture2D>
			}

			abstract class NormalWindow <template<typename WindowClazz>> {
				+NormalWindow()
				+~NormalWindow()
				#handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) : LRESULT
				+getWindowClassOptions() : WNDCLASSEX
				+getCreateOptions() : Window::CreateOptions
				+createResources() : bool
				+isReady() : bool
				-{static} FPS_60 : static constexpr UINT
				-{static} RenderTimerId : static constexpr UINT
				#dxr() : std::shared_ptr<Graphics::DXResources>&
				#dxwr() : std::shared_ptr<Graphics::DXWindowResources>&
				+paint() : void
				#{abstract} render(const std::shared_ptr<Graphics::RenderTarget>& target) : void
			}

			abstract class OverlayWindow <template<typename WindowClazz>> {
				+OverlayWindow()
				+~OverlayWindow()
				#handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) : LRESULT
				+getWindowClassOptions() : WNDCLASSEX
				+getCreateOptions() : Window::CreateOptions
				+createResources() : bool
				+isReady() : bool
				-{static} FPS_60 : static constexpr UINT
				-{static} RenderTimerId : static constexpr UINT
				#{abstract} render(const std::shared_ptr<Graphics::RenderTarget>& target) : void
				+renderWindow() : void
			}

			abstract class Renderer {
				+~Renderer()
				+{abstract} getSHM() : SHM::SHMCachedReader*
				+{abstract} getName() : std::wstring_view {query}
				+{abstract} render(SHM::IPCClientTexture* sourceTexture, const PixelRect& sourceRect, HANDLE destTexture, const PixelSize& destTextureDimensions, const PixelRect& destRect, HANDLE fence, uint64_t fenceValueIn) : uint64_t
				+{abstract} initialize(uint8_t swapchainLength) : void
				+{abstract} saveTextureToFile(SHM::IPCClientTexture*, const std::filesystem::path &) : void
			}

			class TrackMapOverlayWindow {
				+TrackMapOverlayWindow(const TrackMap& trackMap, const std::shared_ptr<SessionDataProvider>& dataProvider)
				+~TrackMapOverlayWindow()
				+{static} ClassName() : PCWSTR
				-unsubscribeFn_ : SessionDataProvider::UnsubscribeFn
				-trackMap_ : const TrackMap
				-dataProvider_ : std::shared_ptr<SessionDataProvider>
				+render(const std::shared_ptr<Graphics::RenderTarget>& target) : void
			}

			class ViewerWindow <template<Graphics::GraphicsPlatform GP>> {
				+{static} ClassName() : PCWSTR
				#getDestRect(const Size<uint32_t> imageSize, const float scale) : PixelRect
				+createResources() : bool
				#createTargetResources(const std::shared_ptr<Graphics::RenderTarget>& target) : void
				#render(const std::shared_ptr<Graphics::RenderTarget>& target) : void
				+resetTargetResources() : void
			}

			class Window {
				+Window()
				+~Window()
				+{static} DefaultWindowMessageLoop() : void
				+{static} PeekWindowMessageLoop(function<void ( MSG& )> callback) : void
			}

			enum ViewerFillMode {
				Checkerboard
				Default
				Transparent
			}

			class BaseWindow::anon_struct_1 {
			}

			class MarkerWidgetState {
			}

			class ViewerSettings {
				+{static} Load() : ViewerSettings
				+operator<=>(const ViewerSettings &) : auto {query}
				+save() : void
			}

			class Window::CreateOptions {
			}
		}

		namespace SHM {
			class ConsumerPattern {
				+ConsumerPattern()
				+ConsumerPattern(std::underlying_type_t<ConsumerKind>( consumerKindMask ))
				+ConsumerPattern(ConsumerKind kind)
				+matches(ConsumerKind) : bool {query}
				+getRawMaskForDebugging() : std::underlying_type_t<ConsumerKind> {query}
			}

			class IPCClientTexture {
				#IPCClientTexture(const PixelSize &, uint8_t swapchainIndex)
				+~IPCClientTexture()
				+getDimensions() : PixelSize {query}
				-dimensions_ : const PixelSize
				-swapchainIndex_ : const uint8_t
				+getSwapchainIndex() : uint8_t {query}
			}

			abstract class IPCTextureCopier {
				+~IPCTextureCopier()
				+{abstract} copy(HANDLE sourceTexture, IPCClientTexture* destinationTexture, HANDLE fence, uint64_t fenceValueIn) : void
			}

			abstract class SHMCachedReader {
				+SHMCachedReader(IPCTextureCopier*, ConsumerKind)
				+~SHMCachedReader()
				+maybeGet() : Snapshot
				+maybeGetMetadata() : Snapshot
				-cache_ : std::deque<Snapshot>
				#{abstract} createIPCClientTexture(const PixelSize &, uint8_t swapchainIndex) : std::shared_ptr<IPCClientTexture>
				-getIPCClientTexture(const PixelSize &, uint8_t swapchainIndex) : std::shared_ptr<IPCClientTexture>
				-clientTextures_ : std::vector<std::shared_ptr<IPCClientTexture>>
				#initializeCache(uint64_t gpuLUID, uint8_t swapchainLength) : void
				#{abstract} releaseIPCHandles() : void
				-updateSession() : void
			}

			class SHMReader {
				+SHMReader()
				+operatorbool() {query}
				+~SHMReader()
				#maybeGetUncached(ConsumerKind) : Snapshot
				#maybeGetUncached(uint64_t gpuLUID, IPCTextureCopier* copier, const std::shared_ptr<IPCClientTexture>& dest, ConsumerKind) : Snapshot {query}
				+getRenderCacheKey(ConsumerKind kind) : size_t {query}
				#p : std::shared_ptr<Impl>
				+getFrameCountForMetricsOnly() : uint64_t {query}
				+getSessionID() : uint64_t {query}
			}

			class Snapshot {
				+Snapshot(nullptr_t)
				+Snapshot(incorrect_kind_t)
				+Snapshot(incorrect_gpu_t)
				+Snapshot(FrameMetadata*, IPCTextureCopier* copier, IPCHandles* source, const std::shared_ptr<IPCClientTexture>& dest)
				+Snapshot(FrameMetadata*)
				+~Snapshot()
				+getLayerConfig(uint8_t layerIndex) : LayerConfig* {query}
				+getConfig() : SHMConfig {query}
				-state_ : State
				+getTexture() : T* {query}
				+hasMetadata() : bool {query}
				+hasTexture() : bool {query}
				+getState() : int {query}
				+getRenderCacheKey() : size_t {query}
				-metadata_ : std::shared_ptr<FrameMetadata>
				-ipcTexture_ : std::shared_ptr<IPCClientTexture>
				+getSequenceNumberForDebuggingOnly() : uint64_t {query}
				+getSessionID() : uint64_t {query}
				+getLayerCount() : uint8_t {query}
			}

			class Writer {
				+Writer(uint64_t gpuLUID)
				+operatorbool() {query}
				+~Writer()
				+beginFrame() : NextFrameInfo
				+try_lock() : bool
				-impl_ : std::shared_ptr<Impl>
				+detach() : void
				+lock() : void
				+submitEmptyFrame() : void
				+submitFrame(const SHMConfig& config, const std::vector<LayerConfig>& layers, HANDLE texture, HANDLE fence) : void
				+unlock() : void
			}

			enum ConsumerKind {
				NonVRD3D11
				OculusD3D11
				OculusD3D12
				OpenXR
				SteamVR
				Viewer
			}

			enum SHMHeaderFlags {
				FEEDER_ATTACHED
			}

			enum Snapshot::State {
				Empty
				IncorrectGPU
				IncorrectKind
				ValidWithTexture
				ValidWithoutTexture
			}

			class FrameMetadata {
				+layers : LayerConfig
				+config : SHMConfig
				+haveFeeder() : bool {query}
				+getRenderCacheKey() : std::size_t {query}
				+frameNumber : uint64_t
				+magic : uint64_t
				+sessionId : uint64_t
				+layerCount : uint8_t
			}

			class IPCHandles {
				+IPCHandles(HANDLE feederProcess, const FrameMetadata& frame)
				+fenceHandle : winrt::handle
				+textureHandle : winrt::handle
			}

			class LayerConfig {
			}

			class LayerSprite {
				+destRect : PixelRect
				+sourceRect : PixelRect
				+opacity : float
			}

			class SHMConfig {
			}

			class Snapshot::incorrect_gpu_t {
			}

			class Snapshot::incorrect_kind_t {
			}

			class Writer::NextFrameInfo {
			}

			namespace DX11 {
				class SHMDX11CachedReader {
					+SHMDX11CachedReader(ConsumerKind)
					+~SHMDX11CachedReader()
					#copyFence_ : FenceAndValue
					#getIPCFence(HANDLE) : FenceAndValue*
					#getIPCTexture(HANDLE) : ID3D11Texture2D*
					#createIPCClientTexture(const PixelSize &, uint8_t swapchainIndex) : std::shared_ptr<SHM::IPCClientTexture>
					#ipcFences_ : std::unordered_map<HANDLE, FenceAndValue>
					#ipcTextures_ : std::unordered_map<HANDLE, winrt::com_ptr<ID3D11Texture2D>>
					#deviceLUID_ : uint64_t
					#copy(HANDLE sourceTexture, IPCClientTexture* destinationTexture, HANDLE fence, uint64_t fenceValueIn) : void
					+initializeCache(ID3D11Device*, uint8_t swapchainLength) : void
					#releaseIPCHandles() : void
					#waitForPendingCopies() : void
					#device_ : winrt::com_ptr<ID3D11Device5>
					#deviceContext_ : winrt::com_ptr<ID3D11DeviceContext4>
				}

				class Texture {
					+Texture(const PixelSize &, uint8_t swapchainIndex, const winrt::com_ptr<ID3D11Device5> &, const winrt::com_ptr<ID3D11DeviceContext4> &)
					+~Texture()
					+getD3D11ShaderResourceView() : ID3D11ShaderResourceView*
					+getD3D11Texture() : ID3D11Texture2D* {query}
					+copyFrom(ID3D11Texture2D* texture, ID3D11Fence* fenceIn, uint64_t fenceInValue, ID3D11Fence* fenceOut, uint64_t fenceOutValue) : void
					-device_ : winrt::com_ptr<ID3D11Device5>
					-context_ : winrt::com_ptr<ID3D11DeviceContext4>
					-cacheShaderResourceView_ : winrt::com_ptr<ID3D11ShaderResourceView>
					-cacheTexture_ : winrt::com_ptr<ID3D11Texture2D>
				}

				class SHMDX11CachedReader::FenceAndValue {
					+operatorbool() {query}
					+fence_ : winrt::com_ptr<ID3D11Fence>
				}
			}
		}

		namespace Graphics {
			class D2DResources {
				#D2DResources(D3D11Resources*)
				+~D2DResources()
				+popD2DDraw() : HRESULT
				-locks_ : std::unique_ptr<Locks>
				+pushD2DDraw() : void
				#d2dDevice_ : winrt::com_ptr<ID2D1Device>
				+getD2DDevice() : winrt::com_ptr<ID2D1Device>&
				#d2dDeviceContext_ : winrt::com_ptr<ID2D1DeviceContext5>
				+getD2DDeviceContext() : winrt::com_ptr<ID2D1DeviceContext5>&
				#d2dFactory_ : winrt::com_ptr<ID2D1Factory1>
				+getD2DFactory() : winrt::com_ptr<ID2D1Factory1>&
				#directWriteFactory_ : winrt::com_ptr<IDWriteFactory>
				+getDirectWriteFactory() : winrt::com_ptr<IDWriteFactory>&
			}

			class D3D11Resources {
				#D3D11Resources()
				+~D3D11Resources()
				+try_lock() : bool
				-locks_ : std::unique_ptr<Locks>
				#dxgiAdapterLUID_ : uint64_t
				+getDXGIAdapterLUID() : uint64_t
				+lock() : void
				+unlock() : void
				#dxDevice_ : winrt::com_ptr<ID3D11Device5>
				+getDXDevice() : winrt::com_ptr<ID3D11Device5>&
				#dxImmediateContext_ : winrt::com_ptr<ID3D11DeviceContext4>
				+getDXImmediateContext() : winrt::com_ptr<ID3D11DeviceContext4>&
				#dxgiAdapter_ : winrt::com_ptr<IDXGIAdapter4>
				+getDXGIAdapter() : winrt::com_ptr<IDXGIAdapter4>&
				#dxgiDevice_ : winrt::com_ptr<IDXGIDevice2>
				+getDXGIDevice() : winrt::com_ptr<IDXGIDevice2>&
				#dxgiFactory_ : winrt::com_ptr<IDXGIFactory6>
				+getDXGIFactory() : winrt::com_ptr<IDXGIFactory6>&
			}

			class DXResources {
				+DXResources()
				#s2sBackBufferDeviceContext_ : Microsoft::WRL::ComPtr<ID2D1DeviceContext5>
				#spriteBatch_ : std::unique_ptr<SpriteBatch>
				#blackBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				#cursorInnerBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				#cursorOuterBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				#eraserBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				#highlightBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				#whiteBrush_ : winrt::com_ptr<ID2D1SolidColorBrush>
				+getBlackBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
				+getCursorInnerBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
				+getCursorOuterBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
				+getEraserBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
				+getHighlightBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
				+getWhiteBrush() : winrt::com_ptr<ID2D1SolidColorBrush>&
			}

			class DXWindowResources {
				+DXWindowResources(HWND windowHandle, const std::shared_ptr<DXResources>& dxr)
				-windowHandle_ : HWND
				+currentWindowSize() : Size<UINT>
				+resourceWindowSize() : Size<UINT>
				+areResourcesValid() : bool
				+prepare() : bool
				-dxr_ : std::shared_ptr<DXResources>
				+renderTarget() : std::shared_ptr<RenderTarget>
				+reset() : void
				+backBuffer() : winrt::com_ptr<ID3D11Texture2D>&
				-dComp_ : winrt::com_ptr<IDCompositionDevice>
				+dComp() : winrt::com_ptr<IDCompositionDevice>&
				-dCompTarget_ : winrt::com_ptr<IDCompositionTarget>
				+dCompTarget() : winrt::com_ptr<IDCompositionTarget>&
				-dCompVisual_ : winrt::com_ptr<IDCompositionVisual>
				+dCompVisual() : winrt::com_ptr<IDCompositionVisual>&
				+swapChain() : winrt::com_ptr<IDXGISwapChain1>&
			}

			class IPCRenderer {
				-IPCRenderer(const std::shared_ptr<DXResources>& dxr)
				+getIPCTextureResources(uint8_t textureIndex, const PixelSize& size) : IPCTextureResources*
				-isRendering_ : std::atomic_flag
				-dxr_ : std::shared_ptr<DXResources>
				+{static} Create(const std::shared_ptr<DXResources>& dxr) : std::shared_ptr<IPCRenderer>
				-writer_ : std::shared_ptr<SHM::Writer>
				+initializeCanvas(const PixelSize &) : void
				+renderNow(const std::shared_ptr<RenderTarget>& sourceTarget) : void
				+submitFrame(const std::vector<SHM::LayerConfig>& shmLayers, std::uint64_t inputLayerID) : void
			}

			class Opacity {
				+Opacity(float opacity)
				+XMVECTORF32() {query}
				-color_ : DirectX::XMVECTORF32
			}

			class RenderTarget {
				#RenderTarget(const std::shared_ptr<DXResources>& dxr, const winrt::com_ptr<ID3D11Texture2D>& texture)
				+~RenderTarget()
				+d2d() : D2D
				+d3d() : D3D
				-dimensions_ : PixelSize
				+getDimensions() : PixelSize {query}
				-dxr_ : std::shared_ptr<DXResources>
				+{static} Create(const std::shared_ptr<DXResources>& dxr, const winrt::com_ptr<ID3D11Texture2D>& texture) : std::shared_ptr<RenderTarget>
				+{static} Create(const std::shared_ptr<DXResources>& dxr, nullptr_t texture) : std::shared_ptr<RenderTarget>
				+setD3DTexture(const winrt::com_ptr<ID3D11Texture2D> &) : void
				-d2dBitmap_ : winrt::com_ptr<ID2D1Bitmap1>
				-d3dRenderTargetView_ : winrt::com_ptr<ID3D11RenderTargetView>
				-d3dTexture_ : winrt::com_ptr<ID3D11Texture2D>
				+d3dTexture() : winrt::com_ptr<ID3D11Texture2D>&
			}

			class RenderTarget::D2D {
				+D2D(const std::shared_ptr<RenderTarget> &)
				+operatorID2D1DeviceContext*() {query}
				+~D2D()
				+operator->() : ID2D1DeviceContext* {query}
				-parent_ : std::shared_ptr<RenderTarget>
				-acquire() : void
				+reacquire() : void
				+release() : void
			}

			class RenderTarget::D3D {
				+D3D(const std::shared_ptr<RenderTarget> &)
				+~D3D()
				+rtv() : ID3D11RenderTargetView* {query}
				+texture() : ID3D11Texture2D* {query}
				-parent_ : std::shared_ptr<RenderTarget>
			}

			abstract class Renderable <template<typename T>> {
				+Renderable(const std::shared_ptr<DXResources>& resources)
				+~Renderable()
				#resources_ : std::shared_ptr<DXResources>
				+resources() : std::shared_ptr<DXResources>&
				+{abstract} render(const std::shared_ptr<RenderTarget>& target, const T& data) : void
			}

			class SavedState {
				+SavedState(const winrt::com_ptr<ID3D11DeviceContext> &)
				+SavedState(ID3D11DeviceContext*)
				+~SavedState()
			}

			class SpriteBatch {
				+SpriteBatch(ID3D11Device*)
				+~SpriteBatch()
				-dxtkSpriteBatch_ : std::unique_ptr<DirectX::DX11::SpriteBatch>
				+begin(ID3D11RenderTargetView*, const PixelSize& rtvSize, std::function<void __cdecl ( )> setCustomShaders) : void
				+clear(DirectX::XMVECTORF32 color) : void
				+draw(ID3D11ShaderResourceView* source, const PixelRect& sourceRect, const PixelRect& destRect, DirectX::XMVECTORF32 tint) : void
				+end() : void
				-device_ : winrt::com_ptr<ID3D11Device>
				-deviceContext_ : winrt::com_ptr<ID3D11DeviceContext>
			}

			class TrackMapWidget {
				+TrackMapWidget(const TrackMap& trackMap, const std::shared_ptr<DXResources>& resources)
				+~TrackMapWidget()
				-trackMap_ : TrackMap
				-trackMapChanged_ : std::atomic_flag
				-createResources() : void
				-createTargetResources(const std::shared_ptr<RenderTarget>& target) : void
				+render(const std::shared_ptr<RenderTarget>& target, const std::shared_ptr<SessionDataUpdatedDataEvent>& data) : void
				-resetTargetResources() : void
			}

			enum GraphicsPlatform {
				D3D11
				D3D12
				Vulkan
			}

			enum RenderTarget::Mode {
				D2D
				D3D
				Unattached
			}

			abstract class DeviceListener {
				+~DeviceListener()
				+{abstract} onDeviceLost() : void
				+{abstract} onDeviceRestored() : void
			}

			class IPCTextureResources {
				+textureSize : PixelSize
				+fence : winrt::com_ptr<ID3D11Fence>
				+renderTargetView : winrt::com_ptr<ID3D11RenderTargetView>
				+texture : winrt::com_ptr<ID3D11Texture2D>
				+fenceHandle : winrt::handle
				+textureHandle : winrt::handle
			}
		}

		namespace Geometry {
			class CoordinateToPixelConverter <template<typename PixelType=float>> {
				+CoordinateToPixelConverter(size_t zoomLevel)
				+pixelToCoordinate(PixelBase<PixelType> pixel) : Coordinate<>
				+coordinateToPixel(const Coordinate<>& coord) : Pixel
				+clampPixelValue(double value) : PixelType
				+zoomLevel() : ZoomLevel {query}
				-zoomLevel_ : size_t
				+{static} kConvertToInteger : static constexpr bool
			}

			class LapTracjectoryConverter <template<typename PixelType=float>> {
				+LapTracjectoryConverter(ZoomLevel zoomLevel)
				-pixelConverter_ : CoordinateToPixelConverter<PixelType>
				+toPixels(const LapTrajectory& trajectory) : LapCoordinateData
				+toTrackMap(const LapTrajectory& trajectory) : TrackMap
				+{static} kConvertToInteger : static constexpr bool
			}

			enum MetricUnit {
				KM
				Kilometer
				M
				Meter
			}

			class Coordinate <template<typename T=double>> {
				+latitude : T
				+longitude : T
			}

			class LapTracjectoryConverter::LapCoordinateData {
				+max : PixelBase<PixelType>
				+steps : std::vector<LapCoordinateStep>
			}

			class LapTracjectoryConverter::LapCoordinateStep {
				+pixel : PixelBase<PixelType>
				+meters : double
			}

			class PixelBase <template<typename T>> {
				+x : T
				+y : T
			}
		}
	}
}





/' Inheritance relationships '/

IRacingTools.Shared.UI.BaseWindow <|-- IRacingTools.Shared.UI.NormalWindow


IRacingTools.Shared.UI.BaseWindow <|-- IRacingTools.Shared.UI.OverlayWindow


IRacingTools.Shared.Graphics.D2DResources <|-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.Graphics.D3D11Resources <|-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.SHM.IPCClientTexture <|-- IRacingTools.Shared.SHM.DX11.Texture


IRacingTools.Shared.UI.NormalWindow <|-- IRacingTools.Shared.UI.ViewerWindow


IRacingTools.Shared.UI.OverlayWindow <|-- IRacingTools.Shared.UI.TrackMapOverlayWindow


IRacingTools.Shared.Graphics.Renderable <|-- IRacingTools.Shared.Graphics.TrackMapWidget


IRacingTools.Shared.UI.Renderer <|-- IRacingTools.Shared.UI.D3D11Renderer


IRacingTools.Shared.SHM.SHMReader <|-- IRacingTools.Shared.SHM.SHMCachedReader


IRacingTools.Shared.SessionDataEvent <|-- IRacingTools.Shared.SessionDataUpdatedDataEvent


IRacingTools.Shared.SessionDataProvider <|-- IRacingTools.Shared.DiskSessionDataProvider


IRacingTools.Shared.SessionDataProvider <|-- IRacingTools.Shared.LiveSessionDataProvider


IRacingTools.Shared.UI.Window <|-- IRacingTools.Shared.UI.BaseWindow





/' Aggregation relationships '/

IRacingTools.Shared.UI.D3D11Renderer *-- IRacingTools.Shared.Graphics.SpriteBatch


IRacingTools.Shared.Graphics.DXResources *-- IRacingTools.Shared.Graphics.SpriteBatch


IRacingTools.Shared.Graphics.DXWindowResources *-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.DiskSessionDataProvider *-- IRacingTools.Shared.SessionDataAccess


IRacingTools.Shared.SHM.FrameMetadata *-- IRacingTools.Shared.SHM.LayerConfig


IRacingTools.Shared.SHM.FrameMetadata *-- IRacingTools.Shared.SHM.SHMConfig


IRacingTools.Shared.Graphics.IPCRenderer *-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.Graphics.IPCRenderer *-- IRacingTools.Shared.SHM.Writer


IRacingTools.Shared.Geometry.LapTracjectoryConverter *-- IRacingTools.Shared.Geometry.CoordinateToPixelConverter


IRacingTools.Shared.Geometry.LapTracjectoryConverter::LapCoordinateData *-- IRacingTools.Shared.Geometry.PixelBase


IRacingTools.Shared.Geometry.LapTracjectoryConverter::LapCoordinateStep *-- IRacingTools.Shared.Geometry.PixelBase


IRacingTools.Shared.LiveSessionDataProvider *-- IRacingTools.Shared.SessionDataAccess


IRacingTools.Shared.Graphics.RenderTarget *-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.Graphics.RenderTarget::D2D *-- IRacingTools.Shared.Graphics.RenderTarget


IRacingTools.Shared.Graphics.RenderTarget::D3D *-- IRacingTools.Shared.Graphics.RenderTarget


IRacingTools.Shared.Graphics.Renderable *-- IRacingTools.Shared.Graphics.DXResources


IRacingTools.Shared.SHM.SHMCachedReader *-- IRacingTools.Shared.SHM.IPCClientTexture


IRacingTools.Shared.SHM.SHMCachedReader *-- IRacingTools.Shared.SHM.Snapshot


IRacingTools.Shared.SessionDataEvent *-- IRacingTools.Shared.SessionDataEventType


IRacingTools.Shared.SessionDataUpdatedDataEvent o-- IRacingTools.Shared.SessionDataAccess


IRacingTools.Shared.SHM.Snapshot *-- IRacingTools.Shared.SHM.FrameMetadata


IRacingTools.Shared.SHM.Snapshot *-- IRacingTools.Shared.SHM.IPCClientTexture


IRacingTools.Shared.Graphics.SpriteBatch *-- IRacingTools.Shared.Graphics.SpriteBatch


IRacingTools.Shared.Timer *-- IRacingTools.Shared.detail.Event


IRacingTools.Shared.Timer *-- IRacingTools.Shared.detail.TimeEvent


IRacingTools.Shared.UI.TrackMapOverlayWindow "2" *-- IRacingTools.Shared.SessionDataProvider


IRacingTools.Shared.VR.VRLayer *-- IRacingTools.Shared.Size


IRacingTools.Shared.VR.VRLayer *-- IRacingTools.Shared.VR.VRPose






/' Nested objects '/

IRacingTools.Shared.UI.BaseWindow +-- IRacingTools.Shared.UI.BaseWindow::anon_struct_1


IRacingTools.Shared.Geometry.LapTracjectoryConverter +-- IRacingTools.Shared.Geometry.LapTracjectoryConverter::LapCoordinateData


IRacingTools.Shared.Geometry.LapTracjectoryConverter +-- IRacingTools.Shared.Geometry.LapTracjectoryConverter::LapCoordinateStep


IRacingTools.Shared.Rect +-- IRacingTools.Shared.Rect::Origin


IRacingTools.Shared.Graphics.RenderTarget +-- IRacingTools.Shared.Graphics.RenderTarget::Mode


IRacingTools.Shared.SHM.DX11.SHMDX11CachedReader +-- IRacingTools.Shared.SHM.DX11.SHMDX11CachedReader::FenceAndValue


IRacingTools.Shared.SessionDataProvider +-- IRacingTools.Shared.SessionDataProvider::Timing


IRacingTools.Shared.SessionDataUpdatedDataEvent +-- IRacingTools.Shared.SessionDataUpdatedDataEvent::SessionCarState


IRacingTools.Shared.SessionDataUpdatedDataEvent::SessionCarState +-- IRacingTools.Shared.SessionDataUpdatedDataEvent::SessionCarState::anon_struct_1


IRacingTools.Shared.SHM.Snapshot +-- IRacingTools.Shared.SHM.Snapshot::State


IRacingTools.Shared.SHM.Snapshot +-- IRacingTools.Shared.SHM.Snapshot::incorrect_gpu_t


IRacingTools.Shared.SHM.Snapshot +-- IRacingTools.Shared.SHM.Snapshot::incorrect_kind_t


IRacingTools.Shared.VR.VRRenderConfig +-- IRacingTools.Shared.VR.VRRenderConfig::Quirks


IRacingTools.Shared.VR.VRRenderConfig::Quirks +-- IRacingTools.Shared.VR.VRRenderConfig::Quirks::Upscaling


IRacingTools.Shared.UI.Window +-- IRacingTools.Shared.UI.Window::CreateOptions


IRacingTools.Shared.SHM.Writer +-- IRacingTools.Shared.SHM.Writer::NextFrameInfo




@enduml

```
