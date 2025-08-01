import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "./../helpers.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;

namespace Microsoft.ContainerService;

@resource("updateRuns")
@parentResource(Fleet)
@doc("A multi-stage process to perform update operations across members of a Fleet.")
model UpdateRun is ProxyResource<UpdateRunProperties> {
  @doc("The name of the UpdateRun resource.")
  @key("updateRunName")
  @segment("updateRuns")
  @pattern("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$")
  @minLength(1)
  @maxLength(50)
  @path
  @visibility(Lifecycle.Create, Lifecycle.Read)
  name: string;

  ...EntityTagProperty;
}

@doc("The provisioning state of the UpdateRun resource.")
union UpdateRunProvisioningState {
  string,
  ResourceProvisioningState,
}

scalar FleetUpdateStrategyResourceId
  extends Azure.Core.armResourceIdentifier<[
    {
      type: "Microsoft.ContainerService/fleets/updateStrategies",
    }
  ]>;

scalar AutoUpgradeProfileId
  extends Azure.Core.armResourceIdentifier<[
    {
      type: "Microsoft.ContainerService/fleets/updateRuns",
    }
  ]>;

scalar GateResourceId
  extends Azure.Core.armResourceIdentifier<[
    {
      type: "Microsoft.ContainerService/fleets/gates",
    }
  ]>;

@doc("The properties of the UpdateRun.")
model UpdateRunProperties {
  @visibility(Lifecycle.Read)
  @doc("The provisioning state of the UpdateRun resource.")
  provisioningState?: UpdateRunProvisioningState;

  @doc("""
    The resource id of the FleetUpdateStrategy resource to reference.
    
    When creating a new run, there are three ways to define a strategy for the run:
    1. Define a new strategy in place: Set the "strategy" field.
    2. Use an existing strategy: Set the "updateStrategyId" field. (since 2023-08-15-preview)
    3. Use the default strategy to update all the members one by one: Leave both "updateStrategyId" and "strategy" unset. (since 2023-08-15-preview)
    
    Setting both "updateStrategyId" and "strategy" is invalid.
    
    UpdateRuns created by "updateStrategyId" snapshot the referenced UpdateStrategy at the time of creation and store it in the "strategy" field. 
    Subsequent changes to the referenced FleetUpdateStrategy resource do not propagate.
    UpdateRunStrategy changes can be made directly on the "strategy" field before launching the UpdateRun.
    """)
  @added(Versions.v2023_08_15_preview)
  updateStrategyId?: FleetUpdateStrategyResourceId;

  @doc("""
    The strategy defines the order in which the clusters will be updated.
    If not set, all members will be updated sequentially. The UpdateRun status will show a single UpdateStage and a single UpdateGroup targeting all members.
    The strategy of the UpdateRun can be modified until the run is started.
    """)
  strategy?: UpdateRunStrategy;

  @doc("The update to be applied to all clusters in the UpdateRun. The managedClusterUpdate can be modified until the run is started.")
  managedClusterUpdate: ManagedClusterUpdate;

  @visibility(Lifecycle.Read)
  @doc("The status of the UpdateRun.")
  status?: UpdateRunStatus;

  @visibility(Lifecycle.Read)
  @doc("AutoUpgradeProfileId is the id of an auto upgrade profile resource.")
  @added(Versions.v2025_03_01)
  autoUpgradeProfileId?: AutoUpgradeProfileId;
}

@doc("The update to be applied to the ManagedClusters.")
model ManagedClusterUpdate {
  @doc("The upgrade to apply to the ManagedClusters.")
  upgrade: ManagedClusterUpgradeSpec;

  @visibility(Lifecycle.Create, Lifecycle.Read)
  @doc("The node image upgrade to be applied to the target nodes in update run.")
  @added(Versions.v2023_06_15_preview)
  nodeImageSelection?: NodeImageSelection;
}

@doc("The node image upgrade to be applied to the target nodes in update run.")
@added(Versions.v2023_06_15_preview)
model NodeImageSelection {
  @visibility(Lifecycle.Create, Lifecycle.Read)
  @doc("The node image upgrade type.")
  type: NodeImageSelectionType;

  @added(Versions.v2024_05_02_preview)
  @doc("Custom node image versions to upgrade the nodes to. This field is required if node image selection type is Custom. Otherwise, it must be empty. For each node image family (e.g., 'AKSUbuntu-1804gen2containerd'), this field can contain at most one version (e.g., only one of 'AKSUbuntu-1804gen2containerd-2023.01.12' or 'AKSUbuntu-1804gen2containerd-2023.02.12', not both). If the nodes belong to a family without a matching image version in this field, they are not upgraded.")
  @identifiers(#["version"])
  customNodeImageVersions?: NodeImageVersion[];
}

@doc("The node image upgrade type.")
@added(Versions.v2023_06_15_preview)
union NodeImageSelectionType {
  string,

  @doc("Use the latest image version when upgrading nodes. Clusters may use different image versions (e.g., 'AKSUbuntu-1804gen2containerd-2021.10.12' and 'AKSUbuntu-1804gen2containerd-2021.10.19') because, for example, the latest available version is different in different regions.")
  "Latest",

  @doc("The image versions to upgrade nodes to are selected as described below: for each node pool in managed clusters affected by the update run, the system selects the latest image version such that it is available across all other node pools (in all other clusters) of the same image type. As a result, all node pools of the same image type will be upgraded to the same image version. For example, if the latest image version for image type 'AKSUbuntu-1804gen2containerd' is 'AKSUbuntu-1804gen2containerd-2021.10.12' for a node pool in cluster A in region X, and is 'AKSUbuntu-1804gen2containerd-2021.10.17' for a node pool in cluster B in region Y, the system will upgrade both node pools to image version 'AKSUbuntu-1804gen2containerd-2021.10.12'.")
  "Consistent",

  @added(Versions.v2024_05_02_preview)
  @doc("Upgrade the nodes to the custom image versions. When set, update run will use node image versions provided in customNodeImageVersions to upgrade the nodes. If set, customNodeImageVersions must not be empty.")
  "Custom",
}

scalar KubernetesVersion extends string;

@doc("The upgrade to apply to a ManagedCluster.")
model ManagedClusterUpgradeSpec {
  @doc("ManagedClusterUpgradeType is the type of upgrade to be applied.")
  type: ManagedClusterUpgradeType;

  @doc("The Kubernetes version to upgrade the member clusters to.")
  kubernetesVersion?: KubernetesVersion;
}

@doc("The type of upgrade to perform when targeting ManagedClusters.")
union ManagedClusterUpgradeType {
  string,

  @doc("Full upgrades the control plane and all agent pools of the target ManagedClusters. Requires the ManagedClusterUpgradeSpec.KubernetesVersion property to be set.")
  "Full",

  @doc("NodeImageOnly upgrades only the node images of the target ManagedClusters. Requires the ManagedClusterUpgradeSpec.KubernetesVersion property to NOT be set.")
  "NodeImageOnly",

  @doc("ControlPlaneOnly upgrades only targets the KubernetesVersion of the ManagedClusters and will not be applied to the AgentPool. Requires the ManagedClusterUpgradeSpec.KubernetesVersion property to be set.")
  @added(Versions.v2024_02_02_preview)
  "ControlPlaneOnly",
}

@doc("The state of the UpdateRun, UpdateStage, UpdateGroup, or MemberUpdate.")
union UpdateState {
  string,

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that has not been started.")
  "NotStarted",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that is running.")
  "Running",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that is being stopped.")
  "Stopping",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that has stopped.")
  "Stopped",

  @added(Versions.v2023_06_15_preview)
  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that has been skipped.")
  "Skipped",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that has failed.")
  "Failed",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that is pending.")
  "Pending",

  @doc("The state of an UpdateRun/UpdateStage/UpdateGroup/MemberUpdate that has completed.")
  "Completed",
}

@doc("The status for an operation or group of operations.")
model UpdateStatus {
  @visibility(Lifecycle.Read)
  @doc("The time the operation or group was started.")
  startTime?: utcDateTime;

  @visibility(Lifecycle.Read)
  @doc("The time the operation or group was completed.")
  completedTime?: utcDateTime;

  @visibility(Lifecycle.Read)
  @doc("The State of the operation or group.")
  state?: UpdateState;

  @visibility(Lifecycle.Read)
  @doc("The error details when a failure is encountered.")
  error?: Azure.ResourceManager.Foundations.ErrorDetail; // https://github.com/Azure/azure-rest-api-specs/blob/1de0b5315d62e1b40052bad2c9a2f2c89d84ff0f/specification/common-types/resource-management/v5/types.json#L260
}

@doc("The status of a UpdateRun.")
model UpdateRunStatus {
  @visibility(Lifecycle.Read)
  @doc("The status of the UpdateRun.")
  status?: UpdateStatus;

  @visibility(Lifecycle.Read)
  @identifiers(#["name"])
  @doc("The stages composing an update run. Stages are run sequentially withing an UpdateRun.")
  stages?: UpdateStageStatus[];

  @visibility(Lifecycle.Read)
  @doc("The node image upgrade specs for the update run. It is only set in update run when `NodeImageSelection.type` is `Consistent`.")
  @added(Versions.v2023_06_15_preview)
  nodeImageSelection?: NodeImageSelectionStatus;
}

@doc("The node image upgrade specs for the update run.")
@added(Versions.v2023_06_15_preview)
model NodeImageSelectionStatus {
  @visibility(Lifecycle.Read)
  @identifiers(#["version"])
  @doc("The image versions to upgrade the nodes to.")
  selectedNodeImageVersions?: NodeImageVersion[];
}

@doc("The node upgrade image version.")
@added(Versions.v2023_06_15_preview)
model NodeImageVersion {
  @visibility(Lifecycle.Read)
  @doc("The image version to upgrade the nodes to (e.g., 'AKSUbuntu-1804gen2containerd-2022.12.13').")
  version?: string;
}

@doc("The status of a UpdateStage.")
model UpdateStageStatus {
  @visibility(Lifecycle.Read)
  @doc("The status of the UpdateStage.")
  status?: UpdateStatus;

  @visibility(Lifecycle.Read)
  @doc("The name of the UpdateStage.")
  name?: string;

  @visibility(Lifecycle.Read)
  @identifiers(#["name"])
  @doc("The list of groups to be updated as part of this UpdateStage.")
  groups?: UpdateGroupStatus[];

  @visibility(Lifecycle.Read)
  @extension("x-ms-identifiers", #[])
  @doc("The list of Gates that will run before this UpdateStage.")
  @added(Versions.v2025_04_01_preview)
  beforeGates?: UpdateRunGateStatus[];

  @visibility(Lifecycle.Read)
  @extension("x-ms-identifiers", #[])
  @doc("The list of Gates that will run after this UpdateStage.")
  @added(Versions.v2025_04_01_preview)
  afterGates?: UpdateRunGateStatus[];

  @visibility(Lifecycle.Read)
  @doc("The status of the wait period configured on the UpdateStage.")
  afterStageWaitStatus?: WaitStatus;
}

@doc("The status of a UpdateGroup.")
model UpdateGroupStatus {
  @visibility(Lifecycle.Read)
  @doc("The status of the UpdateGroup.")
  status?: UpdateStatus;

  @visibility(Lifecycle.Read)
  @doc("The name of the UpdateGroup.")
  name?: string;

  @visibility(Lifecycle.Read)
  @identifiers(#["name"])
  @doc("The list of member this UpdateGroup updates.")
  members?: MemberUpdateStatus[];

  @visibility(Lifecycle.Read)
  @extension("x-ms-identifiers", #[])
  @doc("The list of Gates that will run before this UpdateGroup.")
  @added(Versions.v2025_04_01_preview)
  beforeGates?: UpdateRunGateStatus[];

  @visibility(Lifecycle.Read)
  @extension("x-ms-identifiers", #[])
  @doc("The list of Gates that will run after this UpdateGroup.")
  @added(Versions.v2025_04_01_preview)
  afterGates?: UpdateRunGateStatus[];
}

@doc("The status of the wait duration.")
model WaitStatus {
  @visibility(Lifecycle.Read)
  @doc("The status of the wait duration.")
  status?: UpdateStatus;

  @visibility(Lifecycle.Read)
  @doc("The wait duration configured in seconds.")
  waitDurationInSeconds?: int32;
}

@doc("The status of the Gate, as represented in the Update Run.")
@added(Versions.v2025_04_01_preview)
model UpdateRunGateStatus {
  @doc("The human-readable display name of the Gate.")
  @visibility(Lifecycle.Read)
  @minLength(1)
  @maxLength(100)
  displayName?: string;

  @doc("The resource id of the Gate.")
  @visibility(Lifecycle.Read)
  gateId?: GateResourceId;

  @doc("The status of the Gate.")
  @visibility(Lifecycle.Read)
  status?: UpdateStatus;
}

@doc("The status of a member update operation.")
model MemberUpdateStatus {
  @visibility(Lifecycle.Read)
  @doc("The status of the MemberUpdate operation.")
  status?: UpdateStatus;

  @visibility(Lifecycle.Read)
  @doc("The name of the FleetMember.")
  name?: string;

  @visibility(Lifecycle.Read)
  @doc("The Azure resource id of the target Kubernetes cluster.")
  clusterResourceId?: string;

  @visibility(Lifecycle.Read)
  @doc("The operation resource id of the latest attempt to perform the operation.")
  operationId?: string;

  @visibility(Lifecycle.Read)
  @doc("The status message after processing the member update operation.")
  @added(Versions.v2023_06_15_preview)
  message?: string;
}

@doc("The target type of a skip request.")
@added(Versions.v2024_02_02_preview)
union TargetType {
  string,

  @doc("Skip the update of a member.")
  Member: "Member",

  @doc("Skip the update of a group.")
  Group: "Group",

  @doc("Skip the update of an entire stage including the after stage wait.")
  Stage: "Stage",

  @doc("Skip the update of the after stage wait of a certain stage.")
  AfterStageWait: "AfterStageWait",
}

@doc("The definition of a single skip request.")
@added(Versions.v2024_02_02_preview)
model SkipTarget {
  @doc("The skip target type.")
  type: TargetType;

  @doc("""
    The skip target's name. 
    To skip a member/group/stage, use the member/group/stage's name;
    Tp skip an after stage wait, use the parent stage's name.
    """)
  name: string;
}

@doc("The properties of a skip operation containing multiple skip requests.")
@added(Versions.v2024_02_02_preview)
model SkipProperties {
  @doc("The targets to skip.")
  @identifiers(#["type", "name"])
  targets: SkipTarget[];
}

@added(Versions.v2023_03_15_preview)
@armResourceOperations
interface UpdateRuns {
  get is ArmResourceRead<UpdateRun>;

  #suppress "@azure-tools/typespec-azure-core/invalid-final-state" "MUST CHANGE AT NEXT VERSION"
  @Azure.Core.useFinalStateVia("azure-async-operation")
  createOrUpdate is ArmResourceCreateOrUpdateAsync<
    UpdateRun,
    Azure.ResourceManager.Foundations.BaseParameters<UpdateRun> &
      IfMatchParameters<UpdateRun> &
      IfNoneMatchParameters<UpdateRun>,
    LroHeaders = Azure.Core.Foundations.RetryAfterHeader
  >;

  #suppress "deprecated" "Existing API"
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "Existing API"
  delete is ArmResourceDeleteAsync<
    UpdateRun,
    Azure.ResourceManager.Foundations.BaseParameters<UpdateRun> &
      IfMatchParameters<UpdateRun>
  >;

  /** List UpdateRun resources by Fleet */
  listByFleet is ArmResourceListByParent<UpdateRun>;

  #suppress "@azure-tools/typespec-azure-resource-manager/arm-post-operation-response-codes" "Existing API"
  @doc("Starts an UpdateRun.")
  start is ArmResourceActionAsync<
    UpdateRun,
    void,
    UpdateRun,
    Azure.ResourceManager.Foundations.BaseParameters<UpdateRun> &
      IfMatchParameters<UpdateRun>
  >;

  #suppress "@azure-tools/typespec-azure-resource-manager/arm-post-operation-response-codes" "Existing API"
  @doc("Stops an UpdateRun.")
  stop is ArmResourceActionAsync<
    UpdateRun,
    void,
    UpdateRun,
    Azure.ResourceManager.Foundations.BaseParameters<UpdateRun> &
      IfMatchParameters<UpdateRun>
  >;

  @doc("Skips one or a combination of member/group/stage/afterStageWait(s) of an update run.")
  @added(Versions.v2024_02_02_preview)
  skip is ArmResourceActionAsync<
    UpdateRun,
    SkipProperties,
    UpdateRun,
    Azure.ResourceManager.Foundations.BaseParameters<UpdateRun> &
      IfMatchParameters<UpdateRun>
  >;
}
