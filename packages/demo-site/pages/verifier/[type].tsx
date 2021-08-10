import type { ChallengeTokenUrlWrapper } from "@centre/verity"
import { BadgeCheckIcon, XCircleIcon } from "@heroicons/react/outline"
import { ArrowCircleRightIcon } from "@heroicons/react/solid"
import { GetServerSideProps, NextPage } from "next"
import Link from "next/link"
import QRCode from "qrcode.react"
import { useState, createRef } from "react"
import useSWR from "swr"
import VerifierLayout from "../../components/verifier/Layout"

type Props = {
  type: string
  baseUrl: string
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  return {
    props: {
      type: context.params.type as string,
      baseUrl: `${process.env.HOST}/api/verification/create?type=${context.params.type}`
    }
  }
}

type QRCodeOrStatusProps = {
  qrCodeData: ChallengeTokenUrlWrapper
  status: string | null
}

const fetcher = (url) => fetch(url).then((res) => res.json())

function QRCodeOrStatus({
  qrCodeData,
  status
}: QRCodeOrStatusProps): JSX.Element {
  if (status === "approved") {
    return <BadgeCheckIcon className="w-48 h-48 mx-auto text-green-400" />
  } else if (status === "rejected") {
    return <XCircleIcon className="w-48 h-48 mx-auto text-red-400" />
  }

  return (
    <>
      <QRCode
        value={JSON.stringify(qrCodeData)}
        className="w-48 h-48 mx-auto"
        renderAs="svg"
      />
      <h2>QR Code Data</h2>
      <pre>{JSON.stringify(qrCodeData, null, 4)}</pre>
    </>
  )
}

function GetStarted({ baseUrl, onClick }): JSX.Element {
  const [url, setUrl] = useState<URL>(new URL(baseUrl))
  const subject = createRef<HTMLInputElement>()
  const contract = createRef<HTMLInputElement>()

  const updateUrl = () => {
    const url = new URL(baseUrl)
    url.searchParams.append("subjectAddress", subject.current.value)
    url.searchParams.append("contractAddress", contract.current.value)
    setUrl(url)
  }

  return (
    <>
      <p>
        To start, a dApp would issue an API call to a verifier to begin the
        verification flow. You can provide an optional ETH address and contract
        address. If given and the verification is successful, the Verifier will
        return a Verification Result and signature that can later be verified in
        a smart contract.
      </p>
      <p>
        This demo uses input fields, but a more user-friendly approach would be
        to have the user connect via MetaMask.
      </p>
      <div>
        <form>
          <div>
            <label
              htmlFor="subjectAddress"
              className="block text-sm font-medium text-gray-700"
            >
              ETH Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="subjectAddress"
                id="subjectAddress"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ref={subject}
                onInput={updateUrl}
                placeholder="0x..."
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contractAddress"
              className="block text-sm font-medium text-gray-700"
            >
              Contract Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="contractAddress"
                id="contractAddress"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ref={contract}
                onInput={updateUrl}
                placeholder="0x..."
              />
            </div>
          </div>
        </form>
      </div>
      <p>{url.href}</p>
      <p>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {
            onClick(subject.current.value, contract.current.value)
          }}
        >
          Start Verification Flow
          <ArrowCircleRightIcon
            className="w-5 h-5 ml-2 -mr-1"
            aria-hidden="true"
          />
        </button>
      </p>
    </>
  )
}

function ScanView({ status, verification }): JSX.Element {
  const { qrCodeData, challenge } = verification
  return (
    <>
      {status === "pending" ? (
        <p>Scan this QR code using the Verity app.</p>
      ) : null}

      <QRCodeOrStatus qrCodeData={qrCodeData} status={status} />

      {status === "pending" ? (
        <>
          <h2>Verification Presentation Request</h2>
          <p>
            After following the url in `challengeTokenUrl`, the mobile
            application will receive the following, which instructs the client
            where and how to make the request to verify the credential.
          </p>
          <p>
            Read more about{" "}
            <Link href="https://identity.foundation/presentation-exchange/">
              Presentation Exchange
            </Link>
            .
          </p>

          <pre>{JSON.stringify(challenge, null, 4)}</pre>
        </>
      ) : null}

      {status === "approved" ? <p>Your credential is verified.</p> : null}

      {status === "rejected" ? <p>Your credential was not verified.</p> : null}

      {status === "approved" || status === "rejected" ? (
        <p>
          <Link href="/admin" passHref>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next Demo: Revocation
              <ArrowCircleRightIcon
                className="w-5 h-5 ml-2 -mr-1"
                aria-hidden="true"
              />
            </button>
          </Link>
        </p>
      ) : null}
    </>
  )
}

const VerifierPage: NextPage<Props> = ({ type, baseUrl }) => {
  const [verification, setVerification] = useState(null)

  const { data } = useSWR(
    () => `/api/verification/${verification.id}/status`,
    fetcher,
    { refreshInterval: 1000 }
  )
  const status = data && data.status

  let title: string
  if (type === "kyc") {
    title = "KYC/AML Verification"
  } else if (type === "credit-score") {
    title = "Credit Score Verification"
  }

  return (
    <VerifierLayout title={title}>
      <div className="prose">
        {!verification ? (
          <GetStarted
            baseUrl={baseUrl}
            onClick={async (subjectAddress, contractAddress) => {
              const url = new URL(baseUrl)
              url.searchParams.append("subjectAddress", subjectAddress)
              url.searchParams.append("contractAddress", contractAddress)
              const response = await fetch(url.href, { method: "POST" })
              const json = await response.json()
              setVerification(json)
            }}
          />
        ) : null}

        {verification ? (
          <ScanView verification={verification} status={status} />
        ) : null}
      </div>
    </VerifierLayout>
  )
}

export default VerifierPage