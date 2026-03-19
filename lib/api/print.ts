import useSWR from "swr"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/context"

type PrintFormat = { name?: string }

export const DEFAULT_SALES_ORDER_PRINT_FORMAT = "Sales Order Confirmation"

export const usePrintFormatsForDoctype = (doctype?: string | null) => {
  const { user } = useAuth()
  const dt = doctype ?? null

  const key = user && dt ? ["printFormatsForDoctype", dt, user.apiKey] : null

  return useSWR(
    key,
    async () => {
      if (!user || !dt) return []
      const response = await apiClient.request<any>(
        "/api/method/prosessed_orderit.orderit.get_print_formats_for_doctype",
        {
          method: "POST",
          body: JSON.stringify({ doctype: dt }),
          auth: { apiKey: user.apiKey, apiSecret: user.apiSecret },
        }
      )
      const raw = response?.message ?? response
      const formats = Array.isArray(raw) ? raw : []
      return formats as PrintFormat[]
    },
    { revalidateOnFocus: false }
  )
}

export const useDefaultSalesOrderPrintFormat = () => {
  const { data: formats = [] } = usePrintFormatsForDoctype("Sales Order")
  const hasDefault = formats.some((f) => f?.name === DEFAULT_SALES_ORDER_PRINT_FORMAT)
  return hasDefault ? DEFAULT_SALES_ORDER_PRINT_FORMAT : (formats?.[0]?.name ?? DEFAULT_SALES_ORDER_PRINT_FORMAT)
}

export const fetchSalesOrderPdfBlob = async (args: {
  apiKey: string
  apiSecret: string
  docname: string
  printFormat: string
}) => {
  const { blob, filename } = await apiClient.requestBlob(
    "/api/method/prosessed_orderit.orderit.get_print_pdf",
    {
      method: "POST",
      body: JSON.stringify({
        doctype: "Sales Order",
        docname: args.docname,
        print_format: args.printFormat,
      }),
      auth: { apiKey: args.apiKey, apiSecret: args.apiSecret },
    }
  )
  return { blob, filename }
}

