import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    console.log("Testing quote...");
    const quote = await yahooFinance.quote('AAPL');
    console.log("Quote result:", JSON.stringify(quote, null, 2).substring(0, 800));
  } catch (e) {
    console.error("Quote error:", e.message);
  }

  try {
    console.log("\nTesting options...");
    const options = await yahooFinance.options('AAPL');
    console.log("Options keys:", Object.keys(options));
    console.log("Expiration dates:", options.expirationDates?.slice(0, 3));
    if (options.options && options.options[0]) {
      const calls = options.options[0].calls || [];
      const puts = options.options[0].puts || [];
      console.log("Calls count:", calls.length);
      console.log("Puts count:", puts.length);

      // Find penny options
      const pennyCalls = calls.filter(c => (c.lastPrice ?? c.ask ?? 999) <= 0.05 && (c.lastPrice ?? c.ask ?? 999) >= 0.01);
      const pennyPuts = puts.filter(p => (p.lastPrice ?? p.ask ?? 999) <= 0.05 && (p.lastPrice ?? p.ask ?? 999) >= 0.01);
      console.log("Penny calls:", pennyCalls.length);
      console.log("Penny puts:", pennyPuts.length);

      if (pennyCalls.length > 0) {
        console.log("Sample penny call:", JSON.stringify(pennyCalls[0], null, 2));
      }
      if (pennyPuts.length > 0) {
        console.log("Sample penny put:", JSON.stringify(pennyPuts[0], null, 2));
      }

      // Also show the cheapest options regardless
      const sortedCalls = [...calls].sort((a, b) => (a.lastPrice || 999) - (b.lastPrice || 999));
      console.log("\nCheapest 3 calls:");
      sortedCalls.slice(0, 3).forEach(c => console.log(`  Strike: ${c.strike}, Last: ${c.lastPrice}, Ask: ${c.ask}, Vol: ${c.volume}, OI: ${c.openInterest}`));
    }
  } catch (e) {
    console.error("Options error:", e.message);
  }
}

test();
