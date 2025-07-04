/**
 * By design, the members exported from this file are functional breaking change detection utilities.
 *
 * In the "breakingChanges directory invocation depth" this file has depth 2,
 * i.e. it is invoked by files with depth 1 and invokes files with depth 3.
 */
import {
  ApiVersionLifecycleStage,
  BreakingChangesCheckType,
  Context,
  logFileName,
} from "./types/breaking-change.js";
import { RawMessageRecord, ResultMessageRecord } from "./types/message.js";
import {
  blobHref,
  branchHref,
  getRelativeSwaggerPathToRepo,
  processOadRuntimeErrorMessage,
  specIsPreview,
} from "./utils/common-utils.js";
import { appendFileSync } from "node:fs";
import * as path from "path";
import { applyRules } from "./utils/apply-rules.js";
import { OadMessage, OadTraceData, addOadTrace } from "./types/oad-types.js";
import { runOad } from "./run-oad.js";
import { processAndAppendOadMessages } from "./utils/oad-message-processor.js";
import { logError, logMessage } from "./log.js";
import { BREAKING_CHANGES_CHECK_TYPES } from "@azure-tools/specs-shared/breaking-change";
import { SpecModel, getPrecedingSwaggers } from "@azure-tools/spec-shared/spec-model";

// We want to display some lines as we improved AutoRest v2 error output since March 2024 to provide multi-line error messages, e.g.:
// https://github.com/Azure/autorest/pull/4934
// For console (diagnostic) logs we want to display the entire stack trace.
// The value here is an arbitrary high number to limit the stack trace in case a bug would cause it to be excessively long.
const stackTraceMaxLength = 500;

// Module-level cache for SpecModel instances
const specModelCache = new Map<string, SpecModel>();

/**
 * Context for breaking change detection operations
 */
export interface BreakingChangeDetectionContext {
  context: Context;
  existingVersionSwaggers: string[]; // Files in existing API version directories
  newVersionSwaggers: string[]; // Files in completely new API version directories
  newVersionChangedSwaggers: string[]; // Files in existing API version directories that have changed
  oadTracer: OadTraceData;
  msgs: ResultMessageRecord[];
  runtimeErrors: RawMessageRecord[];
  tempTagName: string;
}

/**
 * Create a new breaking change detection context
 */
export function createBreakingChangeDetectionContext(
  context: Context,
  existingVersionSwaggers: string[],
  newVersionSwaggers: string[],
  newVersionChangedSwaggers: string[],
  oadTracer: OadTraceData,
): BreakingChangeDetectionContext {
  return {
    context,
    existingVersionSwaggers,
    newVersionSwaggers,
    newVersionChangedSwaggers,
    oadTracer,
    msgs: [],
    runtimeErrors: [],
    tempTagName: "oad-default-tag",
  };
}

/**
 * The entry points for breaking change detection are:
 * - checkBreakingChangeOnSameVersion()
 * - checkCrossVersionBreakingChange()
 * both of which are invoked by the function commands.ts / validateBreakingChange()
 */

/** The function checkBreakingChangeOnSameVersion()
 * maps to the lower "Same-version check" rectangle at:
 * https://aka.ms/azsdk/pr-brch-deep#diagram-explaining-breaking-changes-and-versioning-issues
 *
 * This function is called by the function commands.ts / validateBreakingChange()
 * This function calls doBreakingChangeDetection with appropriate "type" and other parameters.
 */
export async function checkBreakingChangeOnSameVersion(
  detectionContext: BreakingChangeDetectionContext,
): Promise<{
  msgs: ResultMessageRecord[];
  runtimeErrors: RawMessageRecord[];
  oadViolationsCnt: number;
  errorCnt: number;
}> {
  logMessage(`ENTER definition checkBreakingChangeOnSameVersion`);

  let aggregateOadViolationsCnt = 0;
  let aggregateErrorCnt = 0;

  for (const swaggerJson of detectionContext.existingVersionSwaggers) {
    const { oadViolationsCnt, errorCnt } = await doBreakingChangeDetection(
      detectionContext,
      path.resolve(detectionContext.context.prInfo!.workingDir, swaggerJson),
      swaggerJson,
      BREAKING_CHANGES_CHECK_TYPES.SAME_VERSION,
      specIsPreview(swaggerJson) ? "preview" : "stable",
    );
    aggregateOadViolationsCnt += oadViolationsCnt;
    aggregateErrorCnt += errorCnt;
  }

  logMessage(
    `RETURN definition checkBreakingChangeOnSameVersion. ` +
      `msgs.length: ${detectionContext.msgs.length}, ` +
      `aggregateOadViolationsCnt: ${aggregateOadViolationsCnt}, aggregateErrorCnt: ${aggregateErrorCnt}`,
  );

  return {
    msgs: detectionContext.msgs,
    runtimeErrors: detectionContext.runtimeErrors,
    oadViolationsCnt: aggregateOadViolationsCnt,
    errorCnt: aggregateErrorCnt,
  };
}

/** The function checkCrossVersionBreakingChange()
 * maps to the upper "Cross-version check" rectangle at:
 * https://aka.ms/azsdk/pr-brch-deep#diagram-explaining-breaking-changes-and-versioning-issues
 *
 * This function is called by the function commands.ts / validateBreakingChange()
 * This function calls this.doBreakingChangeDetection with appropriate "type" and other parameters.
 */
export async function checkCrossVersionBreakingChange(
  detectionContext: BreakingChangeDetectionContext,
): Promise<{
  msgs: ResultMessageRecord[];
  runtimeErrors: RawMessageRecord[];
  oadViolationsCnt: number;
  errorCnt: number;
}> {
  console.log(`ENTER definition checkCrossVersionBreakingChange`);

  let aggregateOadViolationsCnt = 0;
  let aggregateErrorCnt = 0;
  for (const swaggerPath of detectionContext.newVersionSwaggers
    .concat(detectionContext.newVersionChangedSwaggers)
    .concat(detectionContext.existingVersionSwaggers.filter(isInDevFolder))) {
    const specModel = await getSpecModel(swaggerPath);
    const previousVersions = await getPrecedingSwaggers(swaggerPath, await specModel.getSwaggers());
    const previousStable = previousVersions.stable;
    const previousPreview = previousVersions.preview;
    if (previousStable) {
      const { oadViolationsCnt, errorCnt } = await this.doBreakingChangeDetection(
        path.resolve(this.pr!.workingDir, previousStable),
        swaggerJson,
        "CrossVersion",
        "stable",
      );
      aggregateOadViolationsCnt += oadViolationsCnt;
      aggregateErrorCnt += errorCnt;
    }
    if (previousPreview) {
      const { oadViolationsCnt, errorCnt } = await this.doBreakingChangeDetection(
        path.resolve(this.pr!.workingDir, previousPreview),
        swaggerJson,
        "CrossVersion",
        "preview",
      );
      // This code block is commented out because we are purposefully ignoring errorCnt here,
      // not adding them to aggregateErrorCnt,
      // as they originate from cross-version comparison with a preview version.
      //
      // Comparison to previous preview version must never cause the breaking change process to report failure, per:
      // - https://github.com/Azure/azure-sdk-tools/issues/6396
      //
      // Contrast this with same-version API breaking changes detection on a preview version, which still produces
      // errors/failures.
      //
      // aggregateErrorCnt += errorCnt;

      // There is no need to ignore oadViolationsCnt here, as it is expected to be zero, due
      // to applyRules.ts / applyRule() function downgrading the severity of all "Error" messages.
      aggregateOadViolationsCnt += oadViolationsCnt;
    }
    if (!previousPreview && !previousStable) {
      this.checkAPIsBeingMovedToANewSpec(swaggerJson);
    }
  }
  console.log(
    `RETURN definition checkCrossVersionBreakingChange. ` +
      `this.msgs.length: ${this.msgs.length}, ` +
      `aggregateOadViolationsCnt: ${aggregateOadViolationsCnt}, aggregateErrorCnt: ${aggregateErrorCnt}`,
  );

  return {
    msgs: this.msgs,
    oadViolationsCnt: aggregateOadViolationsCnt,
    errorCnt: aggregateErrorCnt,
  };
}

/**
 * The function doBreakingChangeDetection()
 * is called by
 *
 * - checkBreakingChangeOnSameVersion()
 * - or checkCrossVersionBreakingChange()
 *
 * with appropriate options.
 *
 * Most importantly, this function does the following:
 *
 * 1. Invokes "@azure/oad" via call to runOad() to obtain OadMessage[] collection.
 *
 * 2. It post-processes the OadMessage[] collection by calling
 *    applyRules() function
 *
 *    which uses the oadMessagesRuleMap.ts config to schedule
 *    appropriate "review required" labels to be added downstream by doBreakingChangeDetection() calling addBreakingChangeLabelsToBeAdded()
 *    as well as updates the OAD messages severity.
 *
 * 3. It saves the OadMessage[] collection to the unified pipeline store ("pipe.log" file) in call to:
 *    processAndAppendOadMessages()
 *
 * 4. It saves OAD errors, if any, to the unified pipeline store ("pipe.log" file) in call to:
 *    appendOadRuntimeErrors()
 */
export async function doBreakingChangeDetection(
  detectionContext: BreakingChangeDetectionContext,
  oldSpec: string,
  newSpec: string,
  scenario: BreakingChangesCheckType,
  previousApiVersionLifecycleStage: ApiVersionLifecycleStage,
): Promise<{ oadViolationsCnt: number; errorCnt: number }> {
  logMessage(`ENTER definition doBreakingChangeDetection oldSpec: ${oldSpec}, newSpec: ${newSpec}`);

  let oadViolationsCnt = 0;
  let errorCnt = 0;

  try {
    await detectionContext.context.prInfo!.checkout(detectionContext.context.prInfo!.baseBranch);
    const oadMessages = await runOad(
      path.resolve(detectionContext.context.localSpecRepoPath, oldSpec),
      newSpec,
    );

    // Handle tracing separately - no need for a trace of two tags comparison
    detectionContext.oadTracer = addOadTrace(
      detectionContext.oadTracer,
      getRelativeSwaggerPathToRepo(oldSpec),
      newSpec,
    );

    const modifiedOadMessages: OadMessage[] = applyRules(
      oadMessages,
      scenario,
      previousApiVersionLifecycleStage,
    );

    oadViolationsCnt += modifiedOadMessages.filter(
      (oadMessage) => oadMessage.type === "Error",
    ).length;

    const msgs: ResultMessageRecord[] = processAndAppendOadMessages(
      detectionContext.context.oadMessageProcessorContext,
      modifiedOadMessages,
      detectionContext.context.baseBranch,
    );
    detectionContext.msgs = detectionContext.msgs.concat(msgs);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const runtimeError: RawMessageRecord = {
      type: "Raw",
      level: "Error",
      message: "Runtime Exception",
      time: new Date(),
      groupName: previousApiVersionLifecycleStage,
      extra: {
        new: blobHref(getRelativeSwaggerPathToRepo(newSpec)),
        old: branchHref(
          getRelativeSwaggerPathToRepo(
            path.resolve(detectionContext.context.localSpecRepoPath, oldSpec),
          ),
          detectionContext.context.baseBranch,
        ),
        details: processOadRuntimeErrorMessage(error.message, stackTraceMaxLength),
      },
    };
    detectionContext.runtimeErrors.push(runtimeError);
    errorCnt += 1;
    appendFileSync(logFileName, JSON.stringify(runtimeError) + "\n");
    logError(`appendOadRuntimeErrors: ${JSON.stringify(runtimeError)}`);
  }

  logMessage(
    `RETURN definition doBreakingChangeDetection ` +
      `scenario: ${scenario}, ` +
      `previousApiVersionLifecycleStage: ${previousApiVersionLifecycleStage}, ` +
      `oldSpec: ${oldSpec}, newSpec: ${newSpec}, ` +
      `oadViolationsCnt: ${oadViolationsCnt}, errorCnt: ${errorCnt}`,
  );

  return { oadViolationsCnt, errorCnt };
}

function isInDevFolder(swaggerPath: string) {
  return swaggerPath.startsWith("dev/");
}

/**
 * Example:
 * input: specification/network/resource-manager/Microsoft.Network/stable/2019-11-01/network.json
 * returns: specification/network/resource-manager
 */
function getReadmeFolder(swaggerFile: string) {
  const segments = swaggerFile.split(/\\|\//);

  if (segments && segments.length >= 3) {
    // Handle dev folder conversion
    if (segments[0] === "dev") {
      segments[0] = "specification";
    }

    // Look for "resource-manager" or "data-plane" in the path
    const resourceManagerIndex = segments.findIndex((segment) => segment === "resource-manager");
    if (resourceManagerIndex !== -1) {
      return segments.slice(0, resourceManagerIndex + 1).join("/");
    }

    const dataPlaneIndex = segments.findIndex((segment) => segment === "data-plane");
    if (dataPlaneIndex !== -1) {
      return segments.slice(0, dataPlaneIndex + 1).join("/");
    }

    // Default: return first 3 segments
    return segments.slice(0, 3).join("/");
  }

  return undefined;
}

/**
 * Get or create a SpecModel for the given swagger path.
 * Uses caching to avoid redundant SpecModel initialization for the same folder.
 * @param swaggerPath - Path to the swagger file
 * @returns SpecModel instance for the folder containing the swagger file
 */
function getSpecModel(swaggerPath: string): SpecModel {
  const folder = getReadmeFolder(swaggerPath);

  if (!folder) {
    throw new Error(`Could not determine readme folder for swagger path: ${swaggerPath}`);
  }

  // Check if we already have a SpecModel for this folder
  if (specModelCache.has(folder)) {
    return specModelCache.get(folder)!;
  }

  // Create new SpecModel and cache it
  const specModel = new SpecModel(folder);
  specModelCache.set(folder, specModel);

  return specModel;
}
