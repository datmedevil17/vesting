'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { createOrganization, getProvider, fetchAllOrganizations } from '@/services/blockchain'
import { useWallet } from '@solana/wallet-adapter-react'


const Page = () => {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [orgName, setOrgName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  )

  useEffect(() => {
    if (!program) return
    setLoading(true)
    fetchAllOrganizations(program)
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
      .finally(() => setLoading(false))
  }, [program])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey) {
      setStatus('Wallet not connected or program unavailable.')
      return
    }

    setStatus('Creating organization...')

    try {
      const tx = await createOrganization(program, publicKey, orgName)
      setStatus(`Organization created! Tx: ${tx}`)
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    }
  }

  if (loading) return <div>Loading...</div>;
  return (
    <div className='pt-40'>
      <h2>Create Organization</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Organization Name"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          required
        />
        <button type="submit" disabled={!publicKey}>Create</button>
      </form>
      {status && <p>{status}</p>}
      <div>
        <h3>Organizations</h3>
        <ul>
          {organizations.map((org) => (
            <li key={org.publicKey.toBase58()}>{org.account.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Page
