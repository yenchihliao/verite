import { createCredentialApplication } from "../../../lib/client/credential-application"
import {
  buildAndSignKycAmlFulfillment,
  kycAmlAttestation
} from "../../../lib/issuer/fulfillment"
import { createKycAmlManifest } from "../../../lib/issuer/manifest"
import { didKeyToIssuer, randomDidKey } from "../../../lib/utils/did-fns"
import { validateCredentialSubmission } from "../../../lib/validators/validateCredentialSubmission"
import { revocationListFixture } from "../../fixtures/revocation-list"

describe("buildAndSignKycAmlFulfillment", () => {
  it("builds and signs a kyc/aml fulfillment", async () => {
    const issuerDidKey = await randomDidKey()
    const clientDidKey = await randomDidKey()
    const issuer = didKeyToIssuer(issuerDidKey)
    const credentialIssuer = { id: issuer.did, name: "Verity" }
    const manifest = createKycAmlManifest(credentialIssuer)
    const credentialApplication = await createCredentialApplication(
      clientDidKey,
      manifest
    )
    const acceptedApplication = await validateCredentialSubmission(
      credentialApplication,
      async () => manifest
    )

    const fulfillment = await buildAndSignKycAmlFulfillment(
      issuer,
      acceptedApplication,
      revocationListFixture,
      kycAmlAttestation([])
    )
    expect(fulfillment.credential_fulfillment).toBeDefined()
    expect(fulfillment.credential_fulfillment.manifest_id).toEqual(
      "KYCAMLAttestation"
    )
  })
})