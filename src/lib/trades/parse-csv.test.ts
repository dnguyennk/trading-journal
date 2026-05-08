import { describe, expect, it } from "vitest";
import { parseNinjaTraderCsv } from "@/lib/trades/parse-csv";

const VALID_HEADER =
  "Instrument,Action,Quantity,Price,Time,ID,E/X,Position,Order ID,Name,Commission,Rate,Account,Connection";

describe("parseNinjaTraderCsv", () => {
  it("parses a simple CSV with one fill", () => {
    const csv = [
      VALID_HEADER,
      'MNQ 12-25,Buy,2,20020.00,5/8/2026 9:30:00 AM,fill-1,Entry,2,order-1,ATM,3.00,0.50,APEX-12345,Live',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills).toHaveLength(1);
    expect(fills[0]).toMatchObject({
      id: "fill-1",
      orderId: "order-1",
      symbol: "MNQ 12-25",
      action: "Buy",
      qty: 2,
      price: 20020,
      commission: 3,
      account: "APEX-12345",
    });
    expect(fills[0].time).toBeInstanceOf(Date);
  });

  it("throws when a required header is missing", () => {
    const csv = [
      "Instrument,Action,Quantity,Price,Time,ID,E/X,Position,Name,Commission,Rate,Account,Connection",
      'MNQ,Buy,1,20000,5/8/2026 9:00:00 AM,a,Entry,1,ATM,3.00,0.50,APEX-1,Live',
    ].join("\n");
    expect(() => parseNinjaTraderCsv(csv)).toThrow(/Order ID/);
  });

  it("parses multiple fills", () => {
    const csv = [
      VALID_HEADER,
      'MNQ 12-25,Buy,2,20020.00,5/8/2026 9:30:00 AM,f1,Entry,2,o1,ATM,3.00,0.50,APEX-12345,Live',
      'MNQ 12-25,Sell,2,20030.00,5/8/2026 9:35:00 AM,f2,Exit,0,o2,ATM,3.00,0.50,APEX-12345,Live',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills).toHaveLength(2);
    expect(fills[0].action).toBe("Buy");
    expect(fills[1].action).toBe("Sell");
  });

  it("skips rows with malformed time", () => {
    const csv = [
      VALID_HEADER,
      'MNQ,Buy,1,20000,not-a-date,f1,Entry,1,o1,ATM,3.00,0.50,APEX-1,Live',
      'MNQ,Sell,1,20020,5/8/2026 9:35:00 AM,f2,Exit,0,o2,ATM,3.00,0.50,APEX-1,Live',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills).toHaveLength(1);
    expect(fills[0].id).toBe("f2");
  });

  it("tolerates extra columns at end (NT version differences)", () => {
    const csv = [
      VALID_HEADER + ",ExtraCol",
      'MNQ,Buy,1,20000,5/8/2026 9:00:00 AM,f1,Entry,1,o1,ATM,3.00,0.50,APEX-1,Live,ignored',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills).toHaveLength(1);
  });

  it("parses currency-formatted commission ($3.50)", () => {
    const csv = [
      VALID_HEADER,
      'MNQ,Buy,1,20000,5/8/2026 9:00:00 AM,f1,Entry,1,o1,ATM,$3.50,0.50,APEX-1,Live',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills[0].commission).toBe(3.5);
  });

  it("parses commission with comma thousand-separator ($1,234.56)", () => {
    const csv = [
      VALID_HEADER,
      'MNQ,Buy,1,20000,5/8/2026 9:00:00 AM,f1,Entry,1,o1,ATM,"$1,234.56",0.50,APEX-1,Live',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills[0].commission).toBe(1234.56);
  });

  it("tolerates trailing comma in header line", () => {
    const csv = [
      VALID_HEADER + ",",
      'MNQ,Buy,1,20000,5/8/2026 9:00:00 AM,f1,Entry,1,o1,ATM,3.00,0.50,APEX-1,Live,',
    ].join("\n");
    const fills = parseNinjaTraderCsv(csv);
    expect(fills).toHaveLength(1);
    expect(fills[0].account).toBe("APEX-1");
  });
});
