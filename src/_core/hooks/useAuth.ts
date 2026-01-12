export const useAuth = () => {
  return {
    user: {
      id: 1,
      name: "Demo User",
      role: "owner" as const,
      email: "demo@example.com",
      loginMethod: "manus"
    },
    isLoading: false,
    logout: async () => {
      console.log("Logout mock called");
    }
  };
};
