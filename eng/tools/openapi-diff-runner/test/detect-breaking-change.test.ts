import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkCrossVersionBreakingChange,
  getSpecModel,
  getReadmeFolder,
  checkAPIsBeingMovedToANewSpec,
  isInDevFolder,
  createBreakingChangeDetectionContext,
  type BreakingChangeDetectionContext,
} from "../src/detect-breaking-change.js";
import { Context } from "../src/types/breaking-change.js";

// Mock the external dependencies
vi.mock("@azure-tools/spec-shared/spec-model", () => ({
  SpecModel: vi.fn(),
  getExistedVersionOperations: vi.fn(),
  getPrecedingSwaggers: vi.fn(),
}));

vi.mock("../src/utils/common-utils.js", () => ({
  convertRawErrorToUnifiedMsg: vi.fn().mockReturnValue('{"type":"Raw","level":"Error"}'),
  specIsPreview: vi.fn().mockReturnValue(false),
}));

vi.mock("../src/log.js", () => ({
  logMessage: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
}));

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkCrossVersionBreakingChange,
  getSpecModel,
  getReadmeFolder,
  checkAPIsBeingMovedToANewSpec,
  isInDevFolder,
  createBreakingChangeDetectionContext,
  type BreakingChangeDetectionContext,
} from "../src/detect-breaking-change.js";
import { Context } from "../src/types/breaking-change.js";

// Mock the external dependencies
const mockSpecModel = vi.fn();
const mockGetExistedVersionOperations = vi.fn();
const mockGetPrecedingSwaggers = vi.fn();

vi.mock("@azure-tools/spec-shared/spec-model", () => ({
  SpecModel: mockSpecModel,
  getExistedVersionOperations: mockGetExistedVersionOperations,
  getPrecedingSwaggers: mockGetPrecedingSwaggers,
}));

vi.mock("../src/utils/common-utils.js", () => ({
  convertRawErrorToUnifiedMsg: vi.fn().mockReturnValue('{"type":"Raw","level":"Error"}'),
  specIsPreview: vi.fn().mockReturnValue(false),
}));

vi.mock("../src/log.js", () => ({
  logMessage: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
}));

describe("detect-breaking-change", () => {
  let mockContext: Context;
  let mockDetectionContext: BreakingChangeDetectionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      prInfo: {
        workingDir: "/test/working/dir",
        baseBranch: "main",
        checkout: vi.fn(),
      },
      localSpecRepoPath: "/test/repo",
      baseBranch: "main",
      oadMessageProcessorContext: {},
    } as any;

    mockDetectionContext = createBreakingChangeDetectionContext(
      mockContext,
      ["existing1.json", "existing2.json"],
      ["new1.json", "new2.json"],
      ["changed1.json", "changed2.json"],
      {} as any,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getReadmeFolder", () => {
    it("should extract folder path up to resource-manager", () => {
      const testPath =
        "specification/network/resource-manager/Microsoft.Network/stable/2019-11-01/network.json";
      const result = getReadmeFolder(testPath);
      expect(result).toBe("specification/network/resource-manager");
    });

    it("should extract folder path up to data-plane", () => {
      const testPath =
        "specification/cognitiveservices/data-plane/TextAnalytics/preview/v3.1/textanalytics.json";
      const result = getReadmeFolder(testPath);
      expect(result).toBe("specification/cognitiveservices/data-plane");
    });

    it("should return first 3 segments as fallback", () => {
      const testPath = "specification/someservice/other/file.json";
      const result = getReadmeFolder(testPath);
      expect(result).toBe("specification/someservice/other");
    });

    it("should handle dev folder conversion", () => {
      const testPath =
        "dev/network/resource-manager/Microsoft.Network/stable/2019-11-01/network.json";
      const result = getReadmeFolder(testPath);
      expect(result).toBe("specification/network/resource-manager");
    });

    it("should return undefined for short paths", () => {
      const testPath = "spec/test";
      const result = getReadmeFolder(testPath);
      expect(result).toBeUndefined();
    });

    it("should handle paths with backslashes", () => {
      const testPath =
        "specification\\network\\resource-manager\\Microsoft.Network\\stable\\2019-11-01\\network.json";
      const result = getReadmeFolder(testPath);
      expect(result).toBe("specification/network/resource-manager");
    });
  });

  describe("isInDevFolder", () => {
    it("should return true for dev paths", () => {
      expect(isInDevFolder("dev/test/file.json")).toBe(true);
      expect(isInDevFolder("dev/network/resource-manager/test.json")).toBe(true);
    });

    it("should return false for non-dev paths", () => {
      expect(isInDevFolder("specification/test/file.json")).toBe(false);
      expect(isInDevFolder("other/dev/file.json")).toBe(false);
    });
  });

  describe("getSpecModel", () => {
    beforeEach(() => {
      const mockSpecModelInstance = {
        getSwaggers: vi.fn().mockResolvedValue([]),
      };
      mockSpecModel.mockImplementation(() => mockSpecModelInstance);
    });

    it("should create and cache SpecModel for new folder", () => {
      const testPath =
        "specification/network/resource-manager/Microsoft.Network/stable/2019-11-01/network.json";

      const result1 = getSpecModel(testPath);
      const result2 = getSpecModel(testPath);

      // Should create SpecModel only once due to caching
      expect(mockSpecModel).toHaveBeenCalledTimes(1);
      expect(mockSpecModel).toHaveBeenCalledWith("specification/network/resource-manager");
      expect(result1).toBe(result2); // Same instance due to caching
    });

    it("should create different SpecModels for different folders", () => {
      const testPath1 =
        "specification/network/resource-manager/Microsoft.Network/stable/2019-11-01/network.json";
      const testPath2 =
        "specification/storage/resource-manager/Microsoft.Storage/stable/2021-04-01/storage.json";

      getSpecModel(testPath1);
      getSpecModel(testPath2);

      expect(mockSpecModel).toHaveBeenCalledTimes(2);
      expect(mockSpecModel).toHaveBeenNthCalledWith(1, "specification/network/resource-manager");
      expect(mockSpecModel).toHaveBeenNthCalledWith(2, "specification/storage/resource-manager");
    });

    it("should throw error for invalid swagger path", () => {
      const testPath = "invalid";

      expect(() => getSpecModel(testPath)).toThrow(
        "Could not determine readme folder for swagger path: invalid",
      );
    });
  });

  describe("checkAPIsBeingMovedToANewSpec", () => {
    it("should process moved APIs when found", async () => {
      const mockOperations = new Map([
        [
          "/test/swagger1.json",
          [
            { id: "operation1", path: "/api/test1", httpMethod: "GET" },
            { id: "operation2", path: "/api/test2", httpMethod: "POST" },
          ],
        ],
        ["/test/swagger2.json", [{ id: "operation3", path: "/api/test3", httpMethod: "DELETE" }]],
      ]);

      mockGetExistedVersionOperations.mockResolvedValue(mockOperations);

      await checkAPIsBeingMovedToANewSpec("test.json", []);

      expect(mockGetExistedVersionOperations).toHaveBeenCalledWith("test.json", []);
    });

    it("should handle empty moved APIs", async () => {
      mockGetExistedVersionOperations.mockResolvedValue(new Map());

      await checkAPIsBeingMovedToANewSpec("test.json", []);

      expect(mockGetExistedVersionOperations).toHaveBeenCalledWith("test.json", []);
    });
  });

  describe("checkCrossVersionBreakingChange", () => {
    let mockSpecModelInstance: any;

    beforeEach(() => {
      mockSpecModelInstance = {
        getSwaggers: vi
          .fn()
          .mockResolvedValue([{ path: "/test/swagger1.json" }, { path: "/test/swagger2.json" }]),
      };
      mockSpecModel.mockImplementation(() => mockSpecModelInstance);

      mockGetPrecedingSwaggers.mockResolvedValue({
        stable: "/test/previous-stable.json",
        preview: "/test/previous-preview.json",
      });
    });

    it("should process new version swaggers", async () => {
      mockDetectionContext.newVersionSwaggers = ["new1.json"];
      mockDetectionContext.newVersionChangedSwaggers = [];
      mockDetectionContext.existingVersionSwaggers = [];

      const result = await checkCrossVersionBreakingChange(mockDetectionContext);

      expect(result).toBeDefined();
      expect(result.msgs).toEqual([]);
      expect(result.runtimeErrors).toEqual([]);
      expect(result.oadViolationsCnt).toBe(0);
      expect(result.errorCnt).toBe(0);
    });

    it("should process swaggers with no previous versions", async () => {
      mockGetPrecedingSwaggers.mockResolvedValue({
        stable: undefined,
        preview: undefined,
      });

      mockGetExistedVersionOperations.mockResolvedValue(new Map());

      mockDetectionContext.newVersionSwaggers = ["new1.json"];
      mockDetectionContext.newVersionChangedSwaggers = [];
      mockDetectionContext.existingVersionSwaggers = [];

      const result = await checkCrossVersionBreakingChange(mockDetectionContext);

      expect(result).toBeDefined();
      expect(mockGetExistedVersionOperations).toHaveBeenCalled();
    });
  });

  describe("createBreakingChangeDetectionContext", () => {
    it("should create context with all required properties", () => {
      const context = createBreakingChangeDetectionContext(
        mockContext,
        ["existing1.json"],
        ["new1.json"],
        ["changed1.json"],
        {} as any,
      );

      expect(context.context).toBe(mockContext);
      expect(context.existingVersionSwaggers).toEqual(["existing1.json"]);
      expect(context.newVersionSwaggers).toEqual(["new1.json"]);
      expect(context.newVersionChangedSwaggers).toEqual(["changed1.json"]);
      expect(context.msgs).toEqual([]);
      expect(context.runtimeErrors).toEqual([]);
      expect(context.tempTagName).toBe("oad-default-tag");
    });

    it("should handle empty arrays", () => {
      const context = createBreakingChangeDetectionContext(mockContext, [], [], [], {} as any);

      expect(context.existingVersionSwaggers).toEqual([]);
      expect(context.newVersionSwaggers).toEqual([]);
      expect(context.newVersionChangedSwaggers).toEqual([]);
    });
  });
});
