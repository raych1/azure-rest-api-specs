## TypeScript

These settings apply only when `--typescript` is specified on the command line.
Please also specify `--typescript-sdks-folder=<path to root folder of your azure-sdk-for-js clone>`.

```yaml $(typescript)
modelerfour:
  flatten-models: false
typescript:
  azure-arm: true
  package-name: "@azure/arm-hybridkubernetes"
  output-folder: "$(typescript-sdks-folder)/sdk/hybridkubernetes/arm-hybridkubernetes"
  payload-flattening-threshold: 1
  generate-metadata: true
```
