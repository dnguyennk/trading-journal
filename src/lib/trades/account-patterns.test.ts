import { describe, expect, it } from "vitest";
import { detectAccount } from "@/lib/trades/account-patterns";

describe("detectAccount", () => {
  it("detects Lucid eval (LFE prefix), takes last 4 digits", () => {
    expect(detectAccount("LFE05062645440040", "Lucid")).toEqual({
      firm: "Lucid",
      type: "eval",
      suggestedName: "Lucid Eval #0040",
    });
  });

  it("detects Lucid funded (LFF prefix)", () => {
    expect(detectAccount("LFF05062645440008", "Lucid")).toEqual({
      firm: "Lucid",
      type: "funded",
      suggestedName: "Lucid Funded #0008",
    });
  });

  it("detects Tradeify Select Lite eval (TDFYSL prefix)", () => {
    expect(detectAccount("TDFYSL50105514231", "Tradeify")).toEqual({
      firm: "Tradeify",
      type: "eval",
      suggestedName: "Tradeify Eval #4231",
    });
  });

  it("detects FundedNext eval with 5-digit suffix, takes last 4", () => {
    expect(
      detectAccount("FNFTCHNGOCKYDUYENNGU76536", "FundedNext Bolt"),
    ).toEqual({
      firm: "FundedNext",
      type: "eval",
      suggestedName: "FundedNext Eval #6536",
    });
  });

  it("detects FundedNext eval with 4-digit suffix", () => {
    expect(detectAccount("FNFTCHNGOCKYDUYENNGU8853", "FundedNext Bolt")).toEqual({
      firm: "FundedNext",
      type: "eval",
      suggestedName: "FundedNext Eval #8853",
    });
  });

  it("detects sim accounts case-insensitively", () => {
    expect(detectAccount("sim101", "Lucid")).toEqual({
      firm: "Sim",
      type: "sim",
      suggestedName: "Sim 101",
    });
    expect(detectAccount("SIM200", "Lucid")).toEqual({
      firm: "Sim",
      type: "sim",
      suggestedName: "Sim 200",
    });
  });

  it("detects sim accounts and ignores connection (sims share NT connection)", () => {
    expect(detectAccount("Sim101", "FundedNext Bolt")).toEqual({
      firm: "Sim",
      type: "sim",
      suggestedName: "Sim 101",
    });
    expect(detectAccount("Sim102", "Lucid")).toEqual({
      firm: "Sim",
      type: "sim",
      suggestedName: "Sim 102",
    });
  });

  it("returns null when no prefix matches and no connection", () => {
    expect(detectAccount("UNKNOWN_xyz", null)).toBeNull();
    expect(detectAccount("UNKNOWN_xyz", "")).toBeNull();
  });

  it("falls back to connection name when prefix unknown", () => {
    expect(detectAccount("APX12345", "Apex Connection")).toEqual({
      firm: "Apex Connection",
      type: null,
      suggestedName: "Apex Connection #2345",
    });
  });

  it("strips Bolt/Pro/Live/Sim suffix from connection name", () => {
    expect(detectAccount("UNKNOWN1234", "Topstep Live")).toEqual({
      firm: "Topstep",
      type: null,
      suggestedName: "Topstep #1234",
    });
    expect(detectAccount("UNKNOWN5678", "MyFirm Pro")).toEqual({
      firm: "MyFirm",
      type: null,
      suggestedName: "MyFirm #5678",
    });
  });

  it("uses last 4 chars when account has no trailing digits", () => {
    expect(detectAccount("ABCDEFG", "SomeFirm")).toEqual({
      firm: "SomeFirm",
      type: null,
      suggestedName: "SomeFirm #DEFG",
    });
  });
});
