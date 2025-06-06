# MachineLearning

> see https://aka.ms/autorest

This is the AutoRest configuration file for MachineLearning.



---
## Getting Started
To build the SDK for MachineLearning, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`
---

## Configuration



### Basic Information
These are the global settings for the MachineLearning API.

``` yaml
openapi-type: arm
```

``` yaml $(package-webservices)
tag: package-webservices-2017-01
```

``` yaml $(package-commitmentPlans)
tag: package-commitmentPlans-2016-05-preview
```

``` yaml $(package-workspaces)
tag: package-workspaces-2016-04
```

``` yaml $(package-workspaces)
tag: package-workspaces-2019-10
```

### Tag: package-webservices-2017-01

These settings apply only when `--tag=package-webservices-2017-01` is specified on the command line.

``` yaml $(tag) == 'package-webservices-2017-01'
input-file:
- Microsoft.MachineLearning/stable/2017-01-01/webservices.json
```

### Tag: package-commitmentPlans-2016-05-preview

These settings apply only when `--tag=package-commitmentPlans-2016-05-preview` is specified on the command line.

``` yaml $(tag) == 'package-commitmentPlans-2016-05-preview'
input-file:
- Microsoft.MachineLearning/preview/2016-05-01-preview/commitmentPlans.json
```

### Tag: package-workspaces-2016-04

These settings apply only when `--tag=package-workspaces-2016-04` is specified on the command line.

``` yaml $(tag) == 'package-workspaces-2016-04'
input-file:
- Microsoft.MachineLearning/stable/2016-04-01/workspaces.json
```

### Tag: package-workspaces-2019-10

These settings apply only when `--tag=package-workspaces-2019-10` is specified on the command line.

``` yaml $(tag) == 'package-workspaces-2019-10'
input-file:
- Microsoft.MachineLearning/stable/2019-10-01/workspaces.json
```

### Tag: package-webservices-2016-05-preview

These settings apply only when `--tag=package-webservices-2016-05-preview` is specified on the command line.

``` yaml $(tag) == 'package-webservices-2016-05-preview'
input-file:
- Microsoft.MachineLearning/preview/2016-05-01-preview/webservices.json
```


## Suppression
``` yaml
directive:
  - suppress: TrackedResourcePatchOperation
    from: commitmentPlans.json
    where: $.definitions.CommitmentAssociation
    reason: The CommitmentAssociation is an internal association from a Web Service to a Commitment Plan, which can only be created or updated by Web Service Resource Provider.
```


---
# Code Generation


## Swagger to SDK

This section describes what SDK should be generated by the automatic system.
This is not used by Autorest itself.

``` yaml $(swagger-to-sdk)
swagger-to-sdk:
  - repo: azure-sdk-for-go
  - repo: azure-sdk-for-js
  - repo: azure-sdk-for-node
  - repo: azure-sdk-for-ruby
    after_scripts:
      - bundle install && rake arm:regen_all_profiles['azure_mgmt_machine_learning']
  - repo: azure-resource-manager-schemas
```


## Go

See configuration in [readme.go.md](./readme.go.md)

## Java

These settings apply only when `--java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-libraries-for-java clone>`.

``` yaml $(java)
azure-arm: true
fluent: true
namespace: com.microsoft.azure.management.machinelearning
license-header: MICROSOFT_MIT_NO_CODEGEN
payload-flattening-threshold: 1
output-folder: $(azure-libraries-for-java-folder)/azure-mgmt-machinelearning
```

# Validation

Since this RP has no unique default package, iterate over all of them for validation:

``` yaml $(validation)
batch:
  - package-webservices: true
  - package-commitmentPlans: true
  - package-workspaces: true
```

### Java multi-api

``` yaml $(java) && $(multiapi)
batch:
  - tag: package-webservices-2017-01
  - tag: package-commitmentPlans-2016-05-preview
  - tag: package-webservices-2016-05-preview
  - tag: package-workspaces-2016-04
  - tag: package-workspaces-2019-10
```

### Tag: package-webservices-2017-01 and java

These settings apply only when `--tag=package-webservices-2017-01 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java=<path to the root directory of your azure-sdk-for-java clone>`.

``` yaml $(tag) == 'package-webservices-2017-01' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.machinelearning.v2017_01_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/machinelearning/mgmt-v2017_01_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-commitmentPlans-2016-05-preview and java

These settings apply only when `--tag=package-commitmentPlans-2016-05-preview --java` is specified on the command line.
Please also specify `--azure-libraries-for-java=<path to the root directory of your azure-sdk-for-java clone>`.

``` yaml $(tag) == 'package-commitmentPlans-2016-05-preview' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.machinelearning.v2016_05_01_preview
  output-folder: $(azure-libraries-for-java-folder)/sdk/machinelearning/mgmt-v2016_05_01_preview
regenerate-manager: true
generate-interface: true
```

### Tag: package-webservices-2016-05-preview and java

These settings apply only when `--tag=package-webservices-2016-05-preview --java` is specified on the command line.
Please also specify `--azure-libraries-for-java=<path to the root directory of your azure-sdk-for-java clone>`.

``` yaml $(tag) == 'package-webservices-2016-05-preview' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.machinelearning.v2016_05_01_preview
  output-folder: $(azure-libraries-for-java-folder)/sdk/machinelearning/mgmt-v2016_05_01_preview
regenerate-manager: true
generate-interface: true
```

### Tag: package-workspaces-2016-04 and java

These settings apply only when `--tag=package-workspaces-2016-04 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java=<path to the root directory of your azure-sdk-for-java clone>`.

``` yaml $(tag) == 'package-workspaces-2016-04' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.machinelearning.v2016_04_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/machinelearning/mgmt-v2016_04_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-workspaces-2019-10 and java

These settings apply only when `--tag=package-workspaces-2019-10 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java=<path to the root directory of your azure-sdk-for-java clone>`.

``` yaml $(tag) == 'package-workspaces-2019-10' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.machinelearning.v2019_10_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/machinelearning/mgmt-v2019_10_01
regenerate-manager: true
generate-interface: true
```





