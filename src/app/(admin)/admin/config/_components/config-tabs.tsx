"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TabContent } from "./tab-content"
import { TabRegistration } from "./tab-registration"
import { TabCommittees } from "./tab-committees"
import { TabPortfolios } from "./tab-portfolios"
import { TabFees } from "./tab-fees"
import { TabPayments } from "./tab-payments"
import type { Content } from "@/content/contentSchema"

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
  portfolios: ClientPortfolio[]
}

export interface ClientFee {
  id: string
  label: string
  committeeType: string
  isDtu: boolean
  amountInr: number
}

interface Props {
  content: Content
  committees: ClientCommittee[]
  fees: ClientFee[]
  isAdmin: boolean
}

export function ConfigTabs({ content, committees, fees, isAdmin }: Props) {
  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="committees">Committees</TabsTrigger>
        <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        {isAdmin && <TabsTrigger value="payments">Payments</TabsTrigger>}
      </TabsList>

      <TabsContent value="content" className="mt-6">
        <TabContent content={content} />
      </TabsContent>

      <TabsContent value="registration" className="mt-6">
        <TabRegistration registrationOpen={content.registrationOpen} />
      </TabsContent>

      <TabsContent value="committees" className="mt-6">
        <TabCommittees committees={committees} />
      </TabsContent>

      <TabsContent value="portfolios" className="mt-6">
        <TabPortfolios committees={committees} />
      </TabsContent>

      <TabsContent value="fees" className="mt-6">
        <TabFees fees={fees} />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="payments" className="mt-6">
          <TabPayments
            paymentProvider={content.paymentProvider}
            staticPaymentLink={content.staticPaymentLink}
            sheetSyncUrl={content.sheetSyncUrl}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
