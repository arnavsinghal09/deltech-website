"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setUserRole } from "../actions"

interface UserRow {
  id: string
  email: string
  name: string | null
  role: string
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  MAINTAINER: "outline",
  AUTHOR: "secondary",
  REGISTERER: "secondary",
}

export function UsersTable({ users, selfEmail }: { users: UserRow[]; selfEmail: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const changeRole = (userId: string, role: string) => {
    startTransition(async () => {
      const result = await setUserRole(userId, role as never)
      if (result.success) {
        toast.success("Role updated — takes effect on their next sign-in.")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed.")
      }
    })
  }

  return (
    <div className="editorial-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.email === selfEmail
            return (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name ?? u.email}</p>
                  {u.name && <p className="text-xs text-muted-foreground">{u.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[u.role] ?? "secondary"}>{u.role}</Badge>
                  {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Select
                      value={u.role}
                      onValueChange={(v) => v && v !== u.role && changeRole(u.id, v)}
                      disabled={isSelf || isPending}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MAINTAINER">Maintainer</SelectItem>
                        <SelectItem value="AUTHOR">Author</SelectItem>
                        <SelectItem value="REGISTERER">Registerer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
