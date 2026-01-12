import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LedgerContextType {
  activeLedgerId: number | null;
  setActiveLedgerId: (id: number | null) => void;
  activeLedgerType: "trades" | "rental" | null;
  setActiveLedgerType: (type: "trades" | "rental" | null) => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [activeLedgerId, setActiveLedgerIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("gearbox_active_ledger_id");
    return stored ? parseInt(stored, 10) : null;
  });

  const [activeLedgerType, setActiveLedgerTypeState] = useState<"trades" | "rental" | null>(() => {
    const stored = localStorage.getItem("gearbox_active_ledger_type");
    return stored as "trades" | "rental" | null;
  });

  const setActiveLedgerId = (id: number | null) => {
    setActiveLedgerIdState(id);
    if (id !== null) {
      localStorage.setItem("gearbox_active_ledger_id", id.toString());
    } else {
      localStorage.removeItem("gearbox_active_ledger_id");
    }
  };

  const setActiveLedgerType = (type: "trades" | "rental" | null) => {
    setActiveLedgerTypeState(type);
    if (type !== null) {
      localStorage.setItem("gearbox_active_ledger_type", type);
    } else {
      localStorage.removeItem("gearbox_active_ledger_type");
    }
  };

  return (
    <LedgerContext.Provider
      value={{
        activeLedgerId,
        setActiveLedgerId,
        activeLedgerType,
        setActiveLedgerType,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (context === undefined) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
