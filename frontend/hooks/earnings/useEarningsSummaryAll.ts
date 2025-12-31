"use client"

import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api"
import type { EarningsSummaryAllItem } from "@/lib/types"

type UseEarningsSummaryAllOptions = {
  enabled?: boolean
}

export function useEarningsSummaryAll(
  startDate?: string,
  endDate?: string,
  options?: UseEarningsSummaryAllOptions
) {
  const [data, setData] = useState<EarningsSummaryAllItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const enabled = options?.enabled ?? true

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)

      const qs = new URLSearchParams()
      if (startDate) qs.append("start_date", startDate)
      if (endDate) qs.append("end_date", endDate)

      const url = `/earnings/summary-all${qs.toString() ? `?${qs}` : ""}`

      const response = await apiFetch<EarningsSummaryAllItem[]>(url)
      setData(response)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error loading earnings summary")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
