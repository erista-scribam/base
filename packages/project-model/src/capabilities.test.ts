import { describe, expect, it } from "vitest";
import { defaultProjectAppsBlock } from "./capabilities";

describe("capabilities", () => {
  it("serializes default apps block with Folia and Drama stubs", () => {
    const apps = defaultProjectAppsBlock();
    expect(apps.prosa?.appId).toBe("com.scribo.prosa");
    expect(apps.folia?.appId).toBe("com.scribo.folia");
    expect(apps.drama?.appId).toBe("com.scribo.drama");
    const raw = JSON.stringify(apps);
    expect(raw).toContain("contents/canon/folia");
  });
});
