type PrefixRule = {
  regex: RegExp;
  firm: string;
  type: "eval" | "funded";
  label: string;
};

const PREFIX_RULES: PrefixRule[] = [
  { regex: /^LFE/, firm: "Lucid", type: "eval", label: "Eval" },
  { regex: /^LFF/, firm: "Lucid", type: "funded", label: "Funded" },
  { regex: /^TDFYSL/, firm: "Tradeify", type: "eval", label: "Eval" },
  { regex: /^FNFT/, firm: "FundedNext", type: "eval", label: "Eval" },
];

function normalizeConnection(c: string): string {
  return c.replace(/\s+(Bolt|Pro|Live|Sim)$/i, "").trim();
}

function seqOf(id: string): string {
  const trailingDigits = id.match(/\d+$/)?.[0];
  const source = trailingDigits ?? id;
  return source.slice(-4);
}

export type AccountDetection = {
  firm: string;
  type: "eval" | "funded" | "sim" | null;
  suggestedName: string;
};

export function detectAccount(
  id: string,
  connection: string | null,
): AccountDetection | null {
  if (/^Sim\d+/.test(id)) {
    return {
      firm: "Sim",
      type: "sim",
      suggestedName: `Sim ${id.replace(/^Sim/, "")}`,
    };
  }

  for (const rule of PREFIX_RULES) {
    if (rule.regex.test(id)) {
      return {
        firm: rule.firm,
        type: rule.type,
        suggestedName: `${rule.firm} ${rule.label} #${seqOf(id)}`,
      };
    }
  }

  if (connection) {
    const firm = normalizeConnection(connection);
    if (firm) {
      return {
        firm,
        type: null,
        suggestedName: `${firm} #${seqOf(id)}`,
      };
    }
  }

  return null;
}
