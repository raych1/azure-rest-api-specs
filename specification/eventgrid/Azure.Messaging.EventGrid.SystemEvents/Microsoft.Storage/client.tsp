import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;
//Models
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobCreatedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobCreatedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobDeletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobDeletedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageDirectoryCreatedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageDirectoryCreatedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageDirectoryDeletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageDirectoryDeletedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobRenamedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobRenamedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageDirectoryRenamedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageDirectoryRenamedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageLifecyclePolicyCompletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageLifecyclePolicyCompletedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageLifecyclePolicyActionSummaryDetail,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageLifecyclePolicyActionSummaryDetail,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobTierChangedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobTierChangedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobAccessTier,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobAccessTier, Access.public);
@@usage(Microsoft.EventGrid.SystemEvents.StorageAsyncOperationInitiatedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageAsyncOperationInitiatedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageBlobInventoryPolicyCompletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageBlobInventoryPolicyCompletedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskCompletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskCompletedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskQueuedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskQueuedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentQueuedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentQueuedEventData,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentCompletedEventData,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentCompletedEventData,
  Access.public
);
//Enums
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentCompletedStatus,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentCompletedStatus,
  Access.public
);
@@usage(Microsoft.EventGrid.SystemEvents.StorageTaskCompletedStatus,
  Usage.output | Usage.json
);
@@access(Microsoft.EventGrid.SystemEvents.StorageTaskCompletedStatus,
  Access.public
);

//useSystemTextJsonConverter decorators
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageAsyncOperationInitiatedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageBlobCreatedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageBlobDeletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageBlobInventoryPolicyCompletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageBlobRenamedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageBlobTierChangedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageDirectoryCreatedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageDirectoryDeletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageDirectoryRenamedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageLifecyclePolicyCompletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentCompletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageTaskAssignmentQueuedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageTaskCompletedEventData,
  "csharp"
);
@@useSystemTextJsonConverter(Microsoft.EventGrid.SystemEvents.StorageTaskQueuedEventData,
  "csharp"
);
