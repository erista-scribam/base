import { describe, expect, it } from "vitest";
import { defaultProjectAppsBlock } from "./capabilities";

describe("capabilities", () => {
  it("serializes default apps block with Folia and Drama stubs", () => {
    const apps = defaultProjectAppsBlock();
    expect(apps.prosa?.appId).toBe("com.scribam.prosa");
    expect(apps.folia?.appId).toBe("com.scribam.folia");
    expect(apps.drama?.appId).toBe("com.scribam.drama");
    const raw = JSON.stringify(apps);
    expect(raw).toContain("contents/canon/folia");
  });
});
