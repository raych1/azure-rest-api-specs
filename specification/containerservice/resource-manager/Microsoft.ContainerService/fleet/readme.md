# ContainerServiceFleet

> see https://aka.ms/autorest

## This is the AutoRest configuration file for ContainerServiceFleet.

The service is hosted under the Microsoft.ContainerService resource provider but exposes a separate set of resources, apis, and SDKs.

## Getting Started

To build the SDK for ContainerServices, [install Autorest](https://aka.ms/autorest/install). Then
in this folder, run this command:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the ContainerServices API.


``` yaml
openapi-type: arm
tag: package-2025-04-01-preview
```

### Tag: package-2025-04-01-preview

These settings apply only when `--tag=package-2025-04-01-preview` is specified on the command line.

```yaml $(tag) == 'package-2025-04-01-preview'
input-file:
  - preview/2025-04-01-preview/fleets.json
suppressions:
  - code: AvoidAdditionalProperties
    from: fleets.json
    where: $.definitions.FleetMemberProperties.properties.labels
    reason: Labels are a key/value map that is passed through to the underlying Kubernetes model.
  - code: AvoidAdditionalProperties
    from: fleets.json
    where: $.definitions.FleetMemberUpdateProperties.properties.labels
    reason: Labels are a key/value map that is passed through to the underlying Kubernetes model.
```

### Tag: package-2025-03-01

These settings apply only when `--tag=package-2025-03-01` is specified on the command line.

```yaml $(tag) == 'package-2025-03-01'
input-file:
  - stable/2025-03-01/fleets.json
```

### Tag: package-2024-05-preview

These settings apply only when `--tag=package-2024-05-preview` is specified on the command line.

```yaml $(tag) == 'package-2024-05-preview'
input-file:
  - preview/2024-05-02-preview/fleets.json
```

### Tag: package-2024-04

These settings apply only when `--tag=package-2024-04` is specified on the command line.

``` yaml $(tag) == 'package-2024-04'
input-file:
  - stable/2024-04-01/fleets.json
```

### Tag: package-2024-02-preview

These settings apply only when `--tag=package-2024-02-preview` is specified on the command line.

```yaml $(tag) == 'package-2024-02-preview'
input-file:
  - preview/2024-02-02-preview/fleets.json
```
### Tag: package-2023-10

These settings apply only when `--tag=package-2023-10` is specified on the command line.

``` yaml $(tag) == 'package-2023-10'
input-file:
  - stable/2023-10-15/fleets.json
```

### Tag: package-2023-08-preview

These settings apply only when `--tag=package-2023-08-preview` is specified on the command line.

``` yaml $(tag) == 'package-2023-08-preview'
input-file:
  - preview/2023-08-15-preview/fleets.json
```

### Tag: package-2023-06-preview

These settings apply only when `--tag=package-2023-06-preview` is specified on the command line.

``` yaml $(tag) == 'package-2023-06-preview'
input-file:
  - preview/2023-06-15-preview/fleets.json
```

### Tag: package-2023-03-preview

These settings apply only when `--tag=package-2023-03-preview` is specified on the command line.

``` yaml $(tag) == 'package-2023-03-preview'
input-file:
  - preview/2023-03-15-preview/fleets.json
```

### Tag: package-2022-09-preview

These settings apply only when `--tag=package-2022-09-preview` is specified on the command line.

``` yaml $(tag) == 'package-2022-09-preview'
input-file:
  - preview/2022-09-02-preview/fleets.json
```

### Tag: package-2022-07-preview

These settings apply only when `--tag=package-2022-07-preview` is specified on the command line.

``` yaml $(tag) == 'package-2022-07-preview'
input-file:
  - preview/2022-07-02-preview/fleets.json
```

### Tag: package-2022-06-preview

These settings apply only when `--tag=package-2022-06-preview` is specified on the command line.

``` yaml $(tag) == 'package-2022-06-preview'
input-file:
  - preview/2022-06-02-preview/fleets.json
```

---

# Code Generation

## Swagger to SDK

This section describes what SDK should be generated by the automatic system.
This is not used by Autorest itself.

``` yaml $(swagger-to-sdk)
swagger-to-sdk:
  - repo: azure-sdk-for-python
  - repo: azure-sdk-for-java
  - repo: azure-sdk-for-go
  - repo: azure-sdk-for-net
  - repo: azure-sdk-for-node
  - repo: azure-resource-manager-schemas
  - repo: azure-powershell
```

## C#

See configuration in [readme.csharp.md](./readme.csharp.md)

## Go

See configuration in [readme.go.md](./readme.go.md)

## Python

See configuration in [readme.python.md](./readme.python.md)

## Java

See configuration in [readme.java.md](./readme.java.md)

## Suppression
