// Minimal assertions index for SBOM upload tests (release/0.4.z backport)
// Only includes FileUploadMatchers to avoid unnecessary dependencies

import type { FileUpload } from "../pages/FileUpload";
import {
  fileUploadAssertions,
  type FileUploadMatchers,
} from "./FileUploadMatchers";

// Simple expect with only FileUpload matchers

/**
 * Overload from FileUploadMatchers.ts
 */
function typedExpect(
  value: FileUpload,
): Omit<
  ReturnType<typeof fileUploadAssertions<FileUpload>>,
  keyof FileUploadMatchers
> &
  FileUploadMatchers;

// Default overload
function typedExpect<T>(value: T): ReturnType<typeof fileUploadAssertions<T>>;
function typedExpect<T>(value: T): unknown {
  return fileUploadAssertions(value);
}

export const expect = Object.assign(typedExpect, fileUploadAssertions);
