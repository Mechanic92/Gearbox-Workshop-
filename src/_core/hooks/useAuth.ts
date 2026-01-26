import { trpc } from "@/lib/trpc";

export const useAuth = () => {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();

  return {
    user: user || null,
    isLoading,
    logout: async () => {
      localStorage.removeItem("gearbox_user_id");
      localStorage.removeItem("gearbox_active_ledger_id");
      window.location.href = "/";
    },
    refetch,
  };
};
