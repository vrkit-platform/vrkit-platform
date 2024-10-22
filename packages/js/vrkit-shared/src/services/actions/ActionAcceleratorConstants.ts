import { get as _get } from "lodash"

export function testPlatform(browserTest:RegExp,nodeTest:RegExp):boolean {
	const
		navPlatform = typeof window !== 'undefined' && _get(window,'navigator.platform') as string
	
	if  (navPlatform)
		return browserTest.test(navPlatform.toLowerCase())
	
	return nodeTest.test(typeof process !== "undefined" ? process.platform ?? "" : "")
}


export function isMacTest():boolean {
	return testPlatform(/mac/,/darwin/)
}

export const isMac = isMacTest()



export const
	CommandOrControl = 'CommandOrControl',
	Super = 'super',
	Command = 'command',
	Cmd = 'cmd',
	Meta = 'meta',
	Control = 'control',
	Ctrl = 'ctrl',
	Alt = 'alt',
	Shift = 'shift',
	Down = 'ArrowDown',
	Up = 'ArrowUp',
	Right = 'ArrowRight',
	Left = 'ArrowLeft',
	
	MappedKeys = {
		[CommandOrControl.toLowerCase()]: isMac ? Meta : Ctrl,
		[Control]: Ctrl,
		[Super]: Meta,
		[Command]: Meta,
		[Cmd]: Meta,
		Equal: "=",
		Minus: "-",
		ShiftLeft: Shift,
		AltLeft: Alt,
		BracketLeft: "[",
		BracketRight: "]"
		
	},
	
	// KEY CODE -> ELECTRON KEY CODE
	ElectronMappedKeys = {
		[Meta]: 'Super',
		[Ctrl]: 'Control',
		[Alt]: 'Alt',
		[Shift]: 'Shift',
		[Down]: 'Down',
		[Up]: 'Up',
		[Left]: 'Left',
		[Right]: 'Right'
	},
	
	// KEYS - MODIFIER KEYS
	ModifiedKeyNames = [Ctrl,Alt,Meta,Shift],



	//INPUT TAG NAMES
	InputTagNames = ['INPUT','SELECT','TEXTAREA']
	
	// ELECTRON AVAILABLE
	//isElectron = currentTargetPlatform === "electron"
