/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { DiagnosticInfo } from "@lichtblick/suite-base/panels/DiagnosticStatus/types";
import DiagnosticNodeRow from "@lichtblick/suite-base/panels/DiagnosticSummary/DiagnosticNodeRow";
import { NodeRowProps } from "@lichtblick/suite-base/panels/DiagnosticSummary/types";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import DiagnosticsBuilder from "@lichtblick/suite-base/testing/builders/DiagnosticsBuilder";

describe("DiagnosticNodeRow", () => {
  const onClick = jest.fn();
  const onClickPin = jest.fn();
  let info: DiagnosticInfo;
  let isPinned: boolean;
  let mockProps: NodeRowProps;

  beforeEach(() => {
    info = DiagnosticsBuilder.info();
    isPinned = BasicBuilder.boolean();

    mockProps = { info, isPinned, onClick, onClickPin };
  });

  it("renders diagnostic node row and triggers onClick", () => {
    const displayName = info.displayName;

    render(<DiagnosticNodeRow {...mockProps} />);
    const rowButton = screen.getByTestId("diagnostic-row-button");
    fireEvent.click(rowButton);

    expect(screen.getByText(displayName)).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledWith(info);
  });

  it("triggers onClickPin when pin button is clicked", () => {
    render(<DiagnosticNodeRow {...mockProps} />);

    const pinButton = screen.getByTestId("diagnostic-row-icon");
    fireEvent.click(pinButton);

    expect(onClickPin).toHaveBeenCalledWith(info);
  });
});
