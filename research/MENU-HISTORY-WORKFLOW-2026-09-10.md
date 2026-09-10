# λWAVES Menu and History Workflow

## Purpose

This review covers the commands people need while composing in λWAVES, how those commands should be grouped on Mac and iPad, and how history can remain useful without becoming a permanent workspace. It focuses on behavior that fits the existing web app and does not add background work.

## Decisions

| Area | Decision | Reason |
|---|---|---|
| Top-level menus | Keep **File, Edit, View, Window, About** | The order follows the familiar desktop progression from document actions to editing, presentation, windows, and support. It also maps cleanly to an iPad keyboard menu. |
| Menu grouping | Separate command families with thin dividers | A short menu is easier to scan when save, transfer, and session actions form distinct groups. |
| Labels | Start commands with a plain verb | Labels such as **Save**, **Import**, **Show**, and **Update App** say what will happen. |
| Shortcuts | Show current bindings at the right edge of menu rows | The menu teaches shortcuts without duplicating a static shortcut list. The existing live key sheet remains the searchable reference. |
| Settings | Add **Ctrl/Cmd+,** | This is the platform convention and is useful even while a text field has focus. |
| History | Show ten recent points; retain sixty internally | Ten rows make History a quick destination picker. Normal Undo and Redo still reach the full retained timeline. |
| Accidental jump recovery | Add one-use **History Undo** | It restores the complete timeline that existed before the last direct history jump, including a future that a subsequent edit replaced. |
| Cache repair | Put **Update App** in About | It is an application-support operation rather than a project command. It checks for a worker update, rebuilds λWAVES caches when needed, and reloads without erasing saved projects. |
| Context menus | Keep them short and duplicate commands available elsewhere | Touch users and keyboard users must not depend on a secondary-click-only path. |

## Platform findings

Apple’s menu guidance treats the menu bar as the durable home for an app’s commands and recommends grouping items by function. The standard Mac order begins with the app menu, then File, Edit, Format, View, app-specific menus, Window, and Help. iPad apps with keyboard support can expose the same command structure, which lets users carry learned shortcuts between devices. [[1]](#sources) [[2]](#sources)

λWAVES is a browser app, so it cannot replace the browser’s global menu. Its in-app bar should still follow those expectations where they help: stable placement, conventional names, visible shortcuts, and consistent grouping. **About** is an acceptable project-specific substitute for a native application and Help menu because it already contains λWAVES information and support actions.

Apple recommends concise, action-led text. Context menus should contain a small number of relevant actions, avoid deep submenus, place destructive actions last, and expose important commands in the main interface too. [[3]](#sources) [[4]](#sources) This matters on iPad because hover is not a dependable discovery method. λWAVES should use mouse tags as reinforcement; menus and visible controls remain the authoritative paths.

Toolbars should carry frequent commands while menus retain the complete set. Lower-priority toolbar actions can move into overflow as space shrinks. [[5]](#sources) That matches λWAVES’ current split: transport and rack controls stay immediately available, while save variants, window management, and help live in menus.

The standard Settings shortcut is **Command+,** on Apple platforms. Apple also advises keeping settings small and shipping sensible defaults. [[6]](#sources) λWAVES now binds the same physical command as **Ctrl+,** elsewhere and displays the platform form on Apple hardware.

## DAW and production-tool findings

Logic Pro exposes an Undo History window where selecting an entry jumps across several edits. It also makes the maximum number of retained steps configurable. [[7]](#sources) Logic Pro for iPad keeps Undo immediately available and uses a long press to reveal Redo when the separate Redo button is hidden. [[8]](#sources) λWAVES already has room for both buttons, so hiding Redo would save little and make the state less legible.

FL Studio places project history in its Browser and supports clicking an earlier state. It can list the newest item at the top. FL Studio also warns that recording every knob tweak increases undo work. [[9]](#sources) [[10]](#sources) λWAVES already coalesces a continuous gesture into one history point. Keeping that rule is more valuable than collecting a row for every sampled knob value.

The dangerous case is common to clickable history lists: a user jumps back, makes one unintended edit, and the former future is removed from the active branch. Standard Redo can no longer reach it. The new **History Undo** command holds a shallow copy of the pre-jump timeline and cursor. It restores that timeline once, then discards its recovery copy. A second History Undo cannot oscillate between branches or silently maintain an expanding tree.

Ableton Live, Logic Pro, and Pro Tools publish broad shortcut maps, and Pro Tools presents menu shortcuts beside command names. [[11]](#sources) [[12]](#sources) REAPER and Cubase go further with searchable action or key-command lists, shortcut assignment, and filters. [[13]](#sources) [[14]](#sources) λWAVES’ live Keyboard Shortcuts window is already closer to the REAPER/Cubase model than a static cheat sheet: it is generated from the active bindings and updates after a rebind. The menu now links directly to it with **?**.

## Command structure

The present λWAVES menu should follow this hierarchy:

- **File**: New Project; Save; Save As; Import and Export; quick saves and share operations.
- **Edit**: Undo; Redo; History Undo; Undo History; editing preferences and keyboard settings.
- **View**: appearance, card visibility, full screen, and interface visibility.
- **Window**: rack placement and individual window visibility.
- **About**: About λWAVES; Keyboard Shortcuts; Settings; Update App.

Separators should mark the families above without adding headings. A disabled row should remain in place when unavailable so menus do not shift while the user works. Destructive commands belong at the end of their group and need direct wording.

The app should not claim **Ctrl/Cmd+N** or **Ctrl/Cmd+O** in an ordinary browser tab. Browsers reserve these for new-window and file-opening behavior, and interception is inconsistent. These bindings can be reconsidered if λWAVES runs as an installed standalone PWA and display-mode detection proves that the host no longer owns them. The familiar **Ctrl/Cmd+S**, **Ctrl/Cmd+Shift+S**, **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**, **Ctrl+Y**, **Ctrl/Cmd+,**, and **?** commands are useful today because the app already handles them in its own command layer.

## History behavior

History has three distinct operations:

1. **Undo** moves back one point on the active timeline.
2. **Redo** moves forward one point on the active timeline.
3. **History Undo** returns once to the complete timeline and position that existed immediately before the last clicked history jump.

Only a direct click on a history row arms History Undo. Ordinary Undo and Redo do not replace the saved return point. A new direct jump replaces the older return point because the newest navigation mistake is the one the command should repair. Clearing history also clears the return point.

The History window renders the ten newest retained points in reverse order, with the current point marked. The engine continues to retain sixty points. This cap keeps DOM work fixed and makes the window a brief chooser rather than an alternate editing surface.

## Update App behavior

**Update App** performs an explicit service-worker repair:

1. Warn if the current project has unsaved changes.
2. Ask the current service-worker registration to check for a newer build.
3. If a worker is waiting, activate it through the existing safe handoff and reload this tab.
4. If the server reports the same worker, unregister the λWAVES worker, delete only cache names beginning with `lw-lab-`, and reload from the network.

Project saves remain in local storage. The command does not clear the library, preferences, keyboard mappings, or notebook. It also has no automatic timer, polling loop, or background cache scan.

## Performance constraints

The menu is built only when opened. Shortcut labels are read from the active binding table at that moment. The History window repaints only when the history ring changes and creates at most ten rows. The recovery branch shallow-copies the ring’s entry wrappers while reusing immutable snapshots, which avoids a second full copy of every register state. No part of this pass adds animation frames, audio work, worker jobs, or interval timers.

The browser verification for this change paused the engine with History open for one second and observed zero scheduled frames. It also verified ten rendered rows, one-use branch restoration after a destructive edit, live About/Edit commands, and the waiting-worker activation message.

## Deferred improvements

- Add keyboard navigation across the in-app menus only as a complete system: arrow movement, focus return, Escape dismissal, type-ahead, and correct accessibility roles should ship together.
- Consider a searchable command palette only if the command set outgrows the existing live shortcut window. A second overlapping command surface would add maintenance before it adds speed.
- Consider standalone-only New and Open shortcuts after testing installed PWA behavior on Safari for iPadOS, Safari for macOS, Firefox, and Chromium.
- Add context commands only for frequent object-specific work such as duplicate, rename, and remove. Each must also remain available through a visible control or main menu.

## Sources

1. [Apple Human Interface Guidelines: The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)
2. [Apple: Building and customizing the menu bar with SwiftUI](https://developer.apple.com/documentation/swiftui/building-and-customizing-the-menu-bar-with-swiftui)
3. [Apple Human Interface Guidelines: Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)
4. [Apple Human Interface Guidelines: Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
5. [Apple Human Interface Guidelines: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
6. [Apple Human Interface Guidelines: Settings](https://developer.apple.com/design/human-interface-guidelines/settings)
7. [Apple Logic Pro User Guide: Undo and redo edits](https://support.apple.com/guide/logicpro/undo-and-redo-edits-lgcp1dbd67ab/10.7/mac/11.0)
8. [Apple Logic Pro for iPad User Guide: Undo and redo edits](https://support.apple.com/en-gb/guide/logicpro-ipad/lpipb7b71d2b/ipados)
9. [Image-Line FL Studio Manual: Browser, Current project, and History](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/browser.htm)
10. [Image-Line FL Studio Manual: General settings and Undo History](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_general.htm)
11. [Ableton Live 12 Manual: Keyboard shortcuts](https://www.ableton.com/en/live-manual/12/live-keyboard-shortcuts/)
12. [Avid Pro Tools Shortcuts Guide 2024.3](https://resources.avid.com/SupportFiles/PT/Pro_Tools_Shortcuts_2024.3.pdf)
13. [REAPER User Guide](https://www.reaper.fm/userguide.php)
14. [Steinberg Cubase Pro: Key Commands dialog](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/key_commands/key_commands_dialog_r.html)

