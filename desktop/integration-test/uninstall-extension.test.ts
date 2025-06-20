// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import path from "path";

import { launchApp } from "./launchApp";

describe("Uninstall extension", () => {
  it("should display 'Uninstalling...' during uninstallation and 'Uninstall' when idle", async () => {
    await using app = await launchApp();

    /** Install the extension via file upload
     * This step is necessary to ensure the extension is installed before we try to uninstall it
     */
    const extensionPath = path.resolve(
      __dirname,
      "../../packages/suite-base/src/test/fixtures/lichtblick.suite-extension-turtlesim-0.0.1.foxe",
    );

    const fileInput = app.renderer.locator("[data-puppeteer-file-upload]");
    await fileInput.setInputFiles(extensionPath);

    /** End of installation */

    // Close the data source dialog if it appears
    await app.renderer.getByTestId("DataSourceDialog").getByTestId("CloseIcon").click();

    await app.renderer.getByTestId("PersonIcon").click();
    await app.renderer.getByRole("menuitem", { name: "Extensions" }).click();
    const searchBar = app.renderer.getByPlaceholder("Search Extensions...");
    await searchBar.fill("turtlesim");
    const extensionListItem = app.renderer
      .locator('[data-testid="extension-list-entry"]')
      .filter({ hasText: "turtlesim" })
      .filter({ hasText: "0.0.1" });
    await extensionListItem.click();

    // Click on Uninstall and verifies if uninstalling occurs
    app.renderer.getByText("Uninstall");
    expect(await app.renderer.getByText("Uninstall").isVisible()).toBe(true);
    await app.renderer.getByText("Uninstall").click();

    expect(await app.renderer.getByText("Uninstalling...").isVisible()).toBe(true);
    expect(await app.renderer.getByText("Uninstalling...").isEnabled()).toBe(false);
  }, 60_000);
});
