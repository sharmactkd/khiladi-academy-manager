import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../../api/adminApi.js";
import { couponApi } from "../../../api/couponApi.js";
import { planApi } from "../../../api/planApi.js";

const dataOf = (response) => response?.data?.data || {};
const useAdminControlCenter = () => {
  const [data, setData] = useState({ summary: {}, recentAcademies: [], academies: [], users: [], subscriptions: [], grants: [], plans: [], addOns: [], entitlements: [], coupons: [] });
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true); setError("");
    const results = await Promise.allSettled([adminApi.getOverview(), adminApi.getAcademies({ limit: 100 }), adminApi.getUsers({ limit: 100 }), adminApi.getSubscriptions({ limit: 100 }), adminApi.getGrants(), adminApi.getPlans(), adminApi.getAddOns(), adminApi.getEntitlements(), couponApi.getAll()]);
    const keys = ["overview", "academies", "users", "subscriptions", "grants", "plans", "addOns", "entitlements", "coupons"]; const next = {};
    results.forEach((result, index) => { if (result.status === "fulfilled") next[keys[index]] = dataOf(result.value); });
    setData({ summary: next.overview?.summary || {}, recentAcademies: next.overview?.recentAcademies || [], academies: next.academies?.academies || [], users: next.users?.users || [], subscriptions: next.subscriptions?.subscriptions || [], grants: next.grants?.grants || [], plans: next.plans?.plans || [], addOns: next.addOns?.addOns || [], entitlements: next.entitlements?.entitlements || [], coupons: next.coupons?.coupons || [] });
    const failed = results.find((item) => item.status === "rejected"); if (failed) setError(failed.reason?.response?.data?.message || "Some platform data could not be loaded."); setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const mutate = async (action) => { await action(); await load({ quiet: true }); };
  return { ...data, error, loading, refreshing, refresh: () => load({ quiet: true }), createGrant: (payload) => mutate(() => adminApi.createGrant(payload)), revokeGrant: (id) => mutate(() => adminApi.revokeGrant(id)), grantEntitlement: (payload) => mutate(() => adminApi.grantEntitlement(payload)), revokeEntitlement: (id, reason) => mutate(() => adminApi.revokeEntitlement(id, reason)), updatePlan: (id, payload) => mutate(() => planApi.update(id, payload)), updateAddOn: (id, payload) => mutate(() => adminApi.updateAddOn(id, payload)), createCoupon: (payload) => mutate(() => couponApi.create(payload)), updateCoupon: (id, payload) => mutate(() => couponApi.update(id, payload)) };
};
export default useAdminControlCenter;
