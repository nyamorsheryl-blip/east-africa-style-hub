import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  getCurrencies,
  getDisplayCurrency,
  getStoredPreference,
  getVersion,
  initCurrency,
  setDisplayCurrency,
  subscribe,
} from "@/lib/currency";

const db = supabase as any;

type CurrencyUi = { openPicker: () => void };
const CurrencyUiContext = createContext<CurrencyUi>({ openPicker: () => {} });
export const useCurrencyPicker = () => useContext(CurrencyUiContext);

/** Small button showing the current currency; place it in the top bar or settings. */
export function CurrencyButton({ className = "" }: { className?: string }) {
  const { openPicker } = useCurrencyPicker();
  const version = useSyncExternalStore(subscribe, getVersion, () => 0);
  void version;
  return (
    <button
      onClick={openPicker}
      aria-label="Change currency"
      className={`press glass inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold ${className}`}
    >
      <Globe className="h-3.5 w-3.5" /> {getDisplayCurrency()}
    </button>
  );
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(subscribe, getVersion, () => 0);
  const { user } = useSession();
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);

  // Load currencies, rates and the saved choice once, in the browser
  useEffect(() => {
    let active = true;
    initCurrency().then(({ hasPreference }) => {
      if (!active) return;
      setReady(true);
      if (!hasPreference) {
        setFirstVisit(true);
        setPickerOpen(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Keep the customer's choice in sync with their account
  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    (async () => {
      const { data } = await db.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle();
      if (!active) return;
      const saved: string | null = data?.preferred_currency ?? null;
      const supported = getCurrencies().some((c) => c.code === saved);
      if (saved && supported && saved !== getDisplayCurrency()) {
        setDisplayCurrency(saved);
        setFirstVisit(false);
        setPickerOpen(false);
      } else if (!saved) {
        const local = getStoredPreference();
        if (local) await db.from("profiles").update({ preferred_currency: local }).eq("id", user.id);
      }
    })();
    return () => {
      active = false;
    };
  }, [ready, user?.id]);

  async function choose(code: string) {
    setDisplayCurrency(code);
    setPickerOpen(false);
    setFirstVisit(false);
    if (user) {
      await db.from("profiles").update({ preferred_currency: code }).eq("id", user.id);
    }
  }

  return (
    <CurrencyUiContext.Provider value={{ openPicker: () => setPickerOpen(true) }}>
      {/* Remounting on a currency or rate change makes every price re-render */}
      <Fragment key={version}>{children}</Fragment>
      {ready && pickerOpen && (
        <PickerModal firstVisit={firstVisit} onChoose={choose} onClose={() => setPickerOpen(false)} />
      )}
    </CurrencyUiContext.Provider>
  );
}

function PickerModal({
  firstVisit,
  onChoose,
  onClose,
}: {
  firstVisit: boolean;
  onChoose: (code: string) => void;
  onClose: () => void;
}) {
  const list = getCurrencies();
  const current = getDisplayCurrency();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="card-ml max-h-[85vh] w-full max-w-md overflow-y-auto p-5">
        <div className="text-[16px] font-black">
          {firstVisit ? "Choose your currency" : "Change currency"}
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Every price in MaeLove will be shown in this currency. You can change it any time. Payments are
          charged in Kenyan shillings (KSh) through M-Pesa, and the exact amount is shown at checkout.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {list.map((c) => (
            <button
              key={c.code}
              onClick={() => onChoose(c.code)}
              className={`press rounded-2xl px-3 py-2.5 text-left ${
                c.code === current && !firstVisit ? "bg-primary text-primary-foreground" : "glass"
              }`}
            >
              <div className="text-[13px] font-extrabold">
                {c.code} {c.symbol ? <span className="font-bold opacity-70">{c.symbol}</span> : null}
              </div>
              <div className="text-[11px] opacity-80">{c.name}</div>
            </button>
          ))}
        </div>

        {!firstVisit && (
          <button onClick={onClose} className="press mt-4 w-full rounded-full glass py-2.5 text-[12px] font-extrabold">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
