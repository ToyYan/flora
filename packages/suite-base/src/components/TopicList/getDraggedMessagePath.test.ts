// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { getDraggedMessagePath } from "@lichtblick/suite-base/components/TopicList/getDraggedMessagePath";
import { TopicListItem } from "@lichtblick/suite-base/components/TopicList/useTopicListSearch";

describe("getDraggedMessagePath", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return correct path for topic type", () => {
    const treeItem: TopicListItem = {
      type: "topic",
      item: {
        item: {
          name: "testTopic",
          schemaName: "testSchema",
        },
        positions: new Set<number>(),
        start: 0,
        end: 0,
        score: 0,
      },
    };
    const result = getDraggedMessagePath(treeItem);
    expect(result).toEqual({
      path: "testTopic",
      rootSchemaName: "testSchema",
      isTopic: true,
      isLeaf: false,
      topicName: "testTopic",
    });
  });

  it("should return correct path for schema type", () => {
    const treeItem: TopicListItem = {
      type: "schema",
      item: {
        item: {
          fullPath: "test/full/path",
          topic: {
            schemaName: "testSchema",
            name: "testTopic",
          },
          offset: 0,
          suffix: {
            isLeaf: true,
            pathSuffix: "",
            type: "",
          },
        },
        positions: new Set<number>(),
        start: 0,
        end: 0,
        score: 0,
      },
    };
    const result = getDraggedMessagePath(treeItem);
    expect(result).toEqual({
      path: "test/full/path",
      rootSchemaName: "testSchema",
      isTopic: false,
      isLeaf: true,
      topicName: "testTopic",
    });
  });
});
