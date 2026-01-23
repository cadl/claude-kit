#!/usr/bin/env swift

/**
 * macOS Window ID Helper
 *
 * Finds the largest on-screen window for a given process PID.
 * Used by screenshot scripts to capture native windows with screencapture.
 *
 * Usage: swift macos-window-id.swift <pid>
 * Returns: Window ID (integer) or exits with error
 */

import Foundation
import CoreGraphics

guard CommandLine.arguments.count >= 2 else {
  fputs("Usage: macos-window-id.swift <pid>\n", stderr)
  exit(2)
}

guard let pid = Int32(CommandLine.arguments[1]) else {
  fputs("Invalid pid: \(CommandLine.arguments[1])\n", stderr)
  exit(2)
}

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
let windowInfoList = (CGWindowListCopyWindowInfo(options, kCGNullWindowID) as NSArray?) as? [[String: Any]] ?? []

struct Candidate {
  let windowId: Int
  let area: Double
}

func areaFromBounds(_ bounds: [String: Any]) -> Double {
  let w = (bounds["Width"] as? Double) ?? 0
  let h = (bounds["Height"] as? Double) ?? 0
  return max(0, w) * max(0, h)
}

var candidates: [Candidate] = []

for info in windowInfoList {
  let ownerPid = info[kCGWindowOwnerPID as String] as? Int32 ?? -1
  if ownerPid != pid { continue }

  let layer = info[kCGWindowLayer as String] as? Int ?? 0
  if layer != 0 { continue }

  let alpha = info[kCGWindowAlpha as String] as? Double ?? 1.0
  if alpha <= 0 { continue }

  guard let windowId = info[kCGWindowNumber as String] as? Int else { continue }
  guard let bounds = info[kCGWindowBounds as String] as? [String: Any] else { continue }

  let area = areaFromBounds(bounds)
  if area <= 0 { continue }

  candidates.append(Candidate(windowId: windowId, area: area))
}

guard let best = candidates.sorted(by: { $0.area > $1.area }).first else {
  fputs("No on-screen window found for pid \(pid)\n", stderr)
  exit(1)
}

print(best.windowId)
