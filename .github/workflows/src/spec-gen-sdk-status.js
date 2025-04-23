// @ts-check
import { extractInputs } from "./context.js";
import { GetAzurePipelineArtifact } from "./artifacts.js";
import {
  CheckConclusion,
  CheckStatus,
  CommitStatusState,
  PER_PAGE_MAX,
} from "./github.js";

/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @returns {Promise<void>}
 */
export default async function setSpecGenSdkStatus({ github, context, core }) {
  const inputs = await extractInputs(github, context, core);
  const ado_build_id = inputs.ado_build_id;
  const ado_project_url = inputs.ado_project_url;
  const head_sha = inputs.head_sha;
  if (!ado_build_id || !ado_project_url || !head_sha) {
    throw new Error(
      `Required inputs are not valid: ado_build_id:${ado_build_id}, ado_project_url:${ado_project_url}, head_sha:${head_sha}`,
    );
  }
  const owner = inputs.owner;
  const repo = inputs.repo;
  // Default target is this run itself
  let target_url =
    `https://github.com/${context.repo.owner}/${context.repo.repo}` +
    `/actions/runs/${context.runId}`;

  return await setSpecGenSdkStatusImpl({
    owner,
    repo,
    head_sha,
    target_url,
    github,
    core,
  });
}

/**
 * @param {Object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.head_sha
 * @param {string} params.target_url
 * @param {(import("@octokit/core").Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types.js").Api & { paginate: import("@octokit/plugin-paginate-rest").PaginateInterface; })} params.github
 * @param {typeof import("@actions/core")} params.core
 * @returns {Promise<void>}
 */
export async function setSpecGenSdkStatusImpl({
  owner,
  repo,
  head_sha,
  target_url,
  github,
  core
}) {
  const statusName = "[TEST IGNORE] spec-gen-sdk status";
  const checks = await github.paginate(
    github.rest.checks.listForRef,
    {
      owner,
      repo,
      ref: head_sha,
      per_page: PER_PAGE_MAX
    }
  );
  // Filter sdk generation check runs
  const specGenSdkChecks = checks.filter(check =>
    check.app?.name === 'Azure Pipelines' &&
    check.name.includes('SDK Generation')
  );  

  core.info(`Found ${specGenSdkChecks.length} check runs from Azure Pipelines:`)
  for (const check of specGenSdkChecks) {
    core.info(`- ${check.name}: ${check.status} (${check.conclusion})`);
  }

  // Check if all SDK generation checks have completed
  const allCompleted = specGenSdkChecks.length > 0 && specGenSdkChecks.every(check => 
    check.status === CheckStatus.COMPLETED
  );
  const allIncompletedChecks = specGenSdkChecks.filter(check =>
    check.status !== CheckStatus.COMPLETED
  );
  for (const check of allIncompletedChecks) {
    core.info(`incompleted check runs: ${check.name}: ${check.status} (${check.conclusion})`);
  }
  
  if (!allCompleted) {
    // At least one check is still running or none found yet, set status to pending
    core.info("Some SDK generation checks are not completed. Setting status to pending.");
    
    await github.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: head_sha,
      state: CommitStatusState.PENDING,
      context: statusName,
      description: "Waiting for all spec-gen-sdk checks to complete",
      target_url
    });
  } else {
    // All checks are completed, check their conclusions
    const validationResult = await validateArtifactData({
      checkRuns: specGenSdkChecks,
      core
    });
      
    core.info(`All SDK generation checks completed. Setting status to ${validationResult.state}.`);
    
    await github.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: head_sha,
      state: validationResult.state,
      context: statusName,
      description: validationResult.description,
      target_url
    });
  }
}

/**
 * @typedef {'azure-sdk-for-go' | 'azure-sdk-for-java' | 'azure-sdk-for-js' | 'azure-sdk-for-net' | 'azure-sdk-for-python'} SdkName
 */

/**
 * spec-gen-sdk check required settings
 * @type {Object.<SdkName, {
*   managementPlaneRequired: boolean | undefined,
*   dataPlaneRequired: boolean | undefined,
*   customRequired: boolean | undefined,
* }>}
*/
export const specGenSdkRequiredSettings = {
 "azure-sdk-for-go": {
   managementPlaneRequired: true,
   dataPlaneRequired: false,
   customRequired: undefined,
 },
 "azure-sdk-for-java": {
   managementPlaneRequired: false,
   dataPlaneRequired: false,
   customRequired: undefined,
 },
 "azure-sdk-for-js": {
   managementPlaneRequired: false,
   dataPlaneRequired: false,
   customRequired: undefined,
 },
 "azure-sdk-for-net": {
   managementPlaneRequired: false,
   dataPlaneRequired: false,
   customRequired: undefined,
 },
 "azure-sdk-for-python": {
   managementPlaneRequired: false,
   dataPlaneRequired: false,
   customRequired: undefined,
 },
};

/**
 * @param {Object} params
 * @param {Array<any>} params.checkRuns
 * @param {typeof import("@actions/core")} params.core
 * @returns {Promise<{state: import("./github.js").CommitStatusState, description: string}>}
 */
async function validateArtifactData({
  checkRuns,
  core
}) {
  /** @type {import("./github.js").CommitStatusState} */
  let state = CommitStatusState.SUCCESS;
  let specGenSdkFailedRequiredLanguages = "";
  let description = "spec-gen-sdk checks succeeded";
  for (const checkRun of checkRuns) {
    core.info(`Processing check run: ${checkRun.name} (${checkRun.conclusion})`);
    // Extract the ADO build ID and project URL from the check run details URL
    const buildUrlRegex = /^(.*?)(?=\/_build\/).*?[?&]buildId=(\d+)/;
    const match = checkRun.details_url.match(buildUrlRegex);
    if (!match) {
      throw new Error(
        `Could not extract build ID or project URL from check run details URL: ${checkRun.details_url}`,
      );
    }
    const ado_project_url = match[1];
    const ado_build_id = match[2];
    let artifactName = "spec-gen-sdk-artifact";
    const artifactFileName = `${artifactName}.json`;
    if (checkRun.conclusion === CheckConclusion.FAILURE) {
      // hardcode for testing now
      artifactName = "spec-gen-sdk-artifact-FailedAttempt1";
    }
    const result = await GetAzurePipelineArtifact({
      ado_build_id,
      ado_project_url,
      artifactName,
      artifactFileName,
      core,
    });
    // Parse the JSON data
    if (!result.artifactData) {
      throw new Error(
        `Artifact '${artifactName}' not found in the build with details_url:${checkRun.details_url}`
      );
    }
    const artifactJson = JSON.parse(result.artifactData);
    const isDataPlaneSpecPr = artifactJson.dataPlane;
    const language = artifactJson.language;
    if (!isDataPlaneSpecPr) {
      if (specGenSdkRequiredSettings[language].managementPlaneRequired && checkRun.conclusion !== CheckConclusion.SUCCESS) {
        state = CommitStatusState.FAILURE;
        const shortLanguageName = language.split('-').pop();
        specGenSdkFailedRequiredLanguages += shortLanguageName + ", ";
      }
    }
  }

  if (state === CommitStatusState.FAILURE) {
    specGenSdkFailedRequiredLanguages = specGenSdkFailedRequiredLanguages.replace(/,\s*$/, '');
    description = `spec-gen-sdk failed for ${specGenSdkFailedRequiredLanguages} languages`;
  }

  return {
    state,
    description
  };
}