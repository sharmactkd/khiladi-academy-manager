import { useCallback, useEffect, useMemo, useState } from "react";
import { academyApi } from "../../../api/academyApi.js";
import { billingApi } from "../../../api/billingApi.js";
import { planApi } from "../../../api/planApi.js";
import { getBranches } from "../../../api/branchApi.js";
import useAuth from "../../../hooks/useAuth.js";

const dataOf = (response) => response?.data?.data || response?.data || response || {};
const useSubscriptionBilling = () => {
  const { user } = useAuth(); const [academy, setAcademy] = useState(null); const [branches, setBranches] = useState([]); const [subscription, setSubscription] = useState(null); const [plan, setPlan] = useState(null); const [usage, setUsage] = useState({}); const [plans, setPlans] = useState([]); const [payments, setPayments] = useState([]); const [invoices, setInvoices] = useState([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async ({ quiet = false } = {}) => { quiet ? setRefreshing(true) : setLoading(true); setError(""); const results = await Promise.allSettled([academyApi.getMyAcademy(), getBranches({ status: "active" }), billingApi.getMySubscription(), planApi.getAll(), billingApi.getPayments(), billingApi.getInvoices()]); const [academyResult, branchResult, subscriptionResult, planResult, paymentResult, invoiceResult] = results; if (academyResult.status === "fulfilled") { const data = dataOf(academyResult.value); setAcademy(data.academy || data); } if (branchResult.status === "fulfilled") { const data = dataOf(branchResult.value); setBranches(Array.isArray(data) ? data : data.branches || []); } if (subscriptionResult.status === "fulfilled") { const data = dataOf(subscriptionResult.value); setSubscription(data.subscription || null); setPlan(data.plan || data.subscription?.plan || null); setUsage(data.usage || {}); } if (planResult.status === "fulfilled") setPlans(dataOf(planResult.value).plans || []); if (paymentResult.status === "fulfilled") setPayments(dataOf(paymentResult.value).payments || []); if (invoiceResult.status === "fulfilled") setInvoices(dataOf(invoiceResult.value).invoices || []); const failed = results.find((result) => result.status === "rejected"); if (failed) setError(failed.reason?.response?.data?.message || "Some subscription data could not be loaded."); setLoading(false); setRefreshing(false); }, []);
  useEffect(() => { load(); }, [load]);
  const stats = useMemo(() => { const paid = payments.filter((item) => item.status === "paid"); return { totalPaid: paid.reduce((sum, item) => sum + Number(item.amount || 0), 0), paidPayments: paid.length, invoices: invoices.length, daysLeft: subscription?.endDate ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / 86400000)) : null }; }, [invoices, payments, subscription]);
  const cancel = async () => { await billingApi.cancelSubscription(); await load({ quiet: true }); };
  return { academy, branches, cancel, error, invoices, loading, payments, plan, plans, refresh: () => load({ quiet: true }), refreshing, stats, subscription, usage, user };
};
export default useSubscriptionBilling;
