
## ***NSIS installer*** 

_Bundle artifacts so its easy to copy_

- [ ]  `irt_tool`
- [ ]  `irt_test_renderer` (if not in `irt_tool`)

## ***Shared Lib (`libirt_shared`)***

- [ ] `OverlayWindow`
	- [ ] Properly handle window run loop
	- [ ] Implement resize event handling
	- [ ] add `edit` mode to set position & size
- [ ] speedup seeking on `DiskSessionProvider` start
- [ ] change color of local car/driver
- [ ] `InterProcessRenderer`
- [ ] Detect `vr` (OpenXR) compatible devices
	- [ ] Detect VR spaces size/coordinate systems

## ***Test Renderer/Viewer***


## ***`libirt_openxr`***



## ***`irt_ui`***

- [ ] Move data source from table model to app state
- [ ] DataProvider
	- [ ] Disk 
		- [ ] Add `play` / `pause` / `rewind` / `restart` 
	- [ ] Live
		- [ ] Add `pause`


## `irt_tool`

- [ ] ***Commands***
	- [ ] `dashboard`
		- [ ] `validate`
		      Validate a new dashboard file
		- [ ] `generate`
		      Generate a new dashboard file with the current screen layout
		- [ ] `run`
		      Launches a dashboard in either `live` (default) or `replay/disk` mode if `--ibt <file>` argument is provided
		- [ ] 
