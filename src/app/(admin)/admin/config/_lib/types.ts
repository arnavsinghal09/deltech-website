export interface ClientPortfolio {
  id: string
  committeeId: string
  name: string
  status: string
}

export interface ClientCommittee {
  id: string
  name: string
  slug: string
  agenda: string | null
  type: "STANDARD" | "CRISIS" | "PRESS"
  doubleDelegation: boolean
  isActive: boolean
  sortOrder: number
  aliases: string[]
  portfolios: ClientPortfolio[]
}

export interface ClientFee {
  id: string
  label: string
  committeeType: string
  isDtu: boolean
  amountInr: number
}
