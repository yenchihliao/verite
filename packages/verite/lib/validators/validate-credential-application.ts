import util from 'util'
import type {
  CredentialManifest,
  DecodedCredentialApplication,
  DecodedPresentationSubmission,
  InputDescriptor,
  PresentationDefinition,
  PresentationSubmission,
  W3CCredential,
  W3CPresentation,
  Verifiable,
  InputDescriptorConstraintField
} from "../../types"
import { ValidationError } from "../errors"
import { getManifestIdFromCredentialApplication } from "../issuer/credential-application"
import { validateInputDescriptors } from "./validate-verification-submission"
import { hasPaths } from "../utils/has-paths"
import jsonpath from "jsonpath"

function mapInputsToDescriptors(
  application: DecodedCredentialApplication,
  submission: PresentationSubmission,
  definition?: PresentationDefinition
): Map<string, Verifiable<W3CCredential>[]> {
  const descriptorMap = submission?.descriptor_map ?? []

  return descriptorMap.reduce((map, d) => {
    const match = definition?.input_descriptors.find((id) => id.id === d.id)

    if (!match) {
      return map
    }

    const credentials = jsonpath.query(application, d.path)
    console.log("setting: ", match.id, credentials)
    return map.set(match.id, credentials)
  }, new Map<string, Verifiable<W3CCredential>[]>())
}
/**
 * Validate the format and contents of a Credential Application against the
 * associated Credential Manifest.
 *
 * @throws {ValidationError} If the credential application is invalid.
 */
export async function validateCredentialApplication(
  application: DecodedCredentialApplication,
  manifest?: CredentialManifest
): Promise<void> {
  if (!manifest) {
    throw new ValidationError(
      "Invalid Manifest ID",
      "This issuer doesn't issue credentials for the specified Manifest ID"
    )
  }

  if (getManifestIdFromCredentialApplication(application) !== manifest.id) {
    throw new ValidationError(
      "Invalid Manifest ID",
      "This application does not include a valid manifest id"
    )
  }

  const definition = manifest.presentation_definition
  const submission = application.credential_application.presentation_submission
  // console.log("submission: ", submission)
  if(submission) {
    const credentialMap = mapInputsToDescriptors(application, submission, definition)
    console.log(util.inspect(credentialMap, false, null))
    const descriptor = definition?.input_descriptors
    if(descriptor){
      validateInputDescriptors(credentialMap, definition.input_descriptors)
    }
  }
  // console.log(util.inspect(credentialMap, false, null))
  console.log("verified")
  // Ensure the application has the correct paths
  if (!hasPaths(application, ["credential_application"])) {
    throw new ValidationError(
      "Missing required paths in Credential Application",
      "Input doesn't have the required format for a Credential Application"
    )
  }
}
