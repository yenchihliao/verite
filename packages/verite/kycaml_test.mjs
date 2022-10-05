import {
  randomDidKey,
  buildIssuer,
  buildAndSignFulfillment,
  buildKycAmlManifest,
  buildCredentialApplication,
  buildKycVerificationOffer,
  buildPresentationSubmission,
  validateVerificationSubmission,
  validateCredentialApplication,
  decodeVerifiableCredential,
  decodeVerifiablePresentation,
  getCredentialSchemaAsVCObject,
  getAttestionDefinition
} from "verite"

import { randomBytes } from "crypto"
import { v4 as uuidv4 } from "uuid"
import prompt from "prompt-sync"
import util from 'util'
//  Simulation of key generation and storage
//  Each party will have their own keys and will need to maintain these
const clientDidKey = randomDidKey(randomBytes)
const issuerDidKey = randomDidKey(randomBytes)
const verifierDidKey = randomDidKey(randomBytes)
var conti = prompt()('keys: ')
if(conti){
  console.log(clientDidKey['id'])
  console.log(issuerDidKey['id'])
  console.log(verifierDidKey['id'])
}

//  Issuer builds a manifest representing the type of credential (in this case a KYCAML credential)
const issuer = buildIssuer(issuerDidKey.subject, issuerDidKey.privateKey)
const manifest = buildKycAmlManifest({ id: issuer.did, name: "Taisys" })
var conti = prompt()('manifest: ')
if(conti) {
  console.log(util.inspect(manifest, false, null))
}

//  The credential application is created and returned as a JWT
const encodedApplication = await buildCredentialApplication(clientDidKey, manifest)
// console.log(application)

//  The decoded JWT is necessary when it comes time to issue the verifiable presentation which will include this credential
const application = await decodeVerifiablePresentation(encodedApplication)
var conti = prompt()('application: ')
if(conti) console.log(util.inspect(application, false, null))
await validateCredentialApplication(application, manifest)

//  The issuer is created from the issuer key, and the credential is issued
var conti = prompt()('issuer: ')
if(conti) console.log(util.inspect(issuer, false, null))

//  The attestation is a standardized representation of the issuer
const attestation = {
  type: "KYCAMLAttestation",
  process: "https://verite.id/definitions/processes/kycaml/0.0.1/usa",
  approvalDate: new Date().toISOString()
}
const fulfillment = await buildAndSignFulfillment(
  issuer,
  clientDidKey.subject,
  manifest,
  attestation,
   "KYCAMLCredential",
  {
    // credentialSchema: getCredentialSchemaAsVCObject(getAttestionDefinition(KYCAML_ATTESTATION)),
    credentialSchema: {
      id: "https://verite.id/definitions/schemas/0.0.1/KYCAMLAttestation",
      type: "KYCAMLCredential",
    },
    credentialStatus: {
      id: "http://example.com/revocation-list#42",
      type: "RevocationList2021Status",
      statusListIndex: "42",
      statusListCredential: "http://example.com/revocation-list"
    }
  }
)
// console.log(util.inspect(presentation, false, null))

//  As with the application, the verifiable presentation (which contains the credential)
//  is in JWT form and must be decoded by the subject. This can be done in a mobile app
//  client or a web browser.
const fulfillmentVP = await decodeVerifiablePresentation(fulfillment)
var conti = prompt()('VP:')
if(conti) console.log(util.inspect(fulfillmentVP, false, null))
//prompt()('continue')
//  The verifiable credential is another JWT within the verifiable presentation and
//  can be extracted like this:
const encodedVc = fulfillmentVP.verifiableCredential[0]
//prompt()('continue')
//  The verifiable credential must then be decoded so that the subject can request
//  verification
const vc = await decodeVerifiableCredential(encodedVc.proof.jwt)
// prompt()('vc')
// console.log(util.inspect(decodedVc, false, null))

//  The subject would make a request to the verifier's server to obtain the verification
//  offer. The code below must be executed by the verifier, using the verifier's key.
const offer = buildKycVerificationOffer(
  uuidv4(),
  verifierDidKey.subject,
  "https://test.host/verify",
  "https://other.host/callback",
  [issuer.did]
)
var conti = prompt()('offer:')
if(conti) console.log(util.inspect(offer, false, null))
//prompt()('continue')

//  The subject can then create a submission is the full verification request which would
//  be sent to the verifier that uses the offer created and supplied by the verifier
const submission = await buildPresentationSubmission(
  clientDidKey,
  offer.body.presentation_definition,
  vc
)
// console.log(util.inspect(submission, false, null))

const decodedSub = await decodeVerifiablePresentation(submission)
var conti = prompt()('submission:')
if(conti) console.log(util.inspect(decodedSub, false, null))
//  The verifier will take the submission and verify its authenticity. There is no response
//  from this function, but if it throws, then the credential is invalid.
await validateVerificationSubmission(
  submission,
  offer.body.presentation_definition
)
console.log("Credential verified!")
